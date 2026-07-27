use std::io::Read;
use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;

const LATEST_VERSION_URL: &str = "https://volta.sh/latest-version";
const RELEASE_BASE: &str = "https://github.com/volta-cli/volta/releases/download";

pub fn install_volta() -> Result<PathBuf, String> {
    let target = volta_target()?;
    let version = latest_version()?;
    let home = dirs::home_dir().ok_or_else(|| "could not find your home directory".to_string())?;
    let bin = home.join(".volta").join("bin");

    std::fs::create_dir_all(&bin)
        .map_err(|e| format!("could not create {}: {e}", bin.display()))?;

    let archive = std::env::temp_dir().join(format!("volta-{version}-{target}.tar.gz"));
    let bytes = download(&download_url(&version, target))?;
    std::fs::write(&archive, bytes)
        .map_err(|e| format!("could not write {}: {e}", archive.display()))?;

    let output = Command::new("tar")
        .arg("-xzf")
        .arg(&archive)
        .arg("-C")
        .arg(&bin)
        .output()
        .map_err(|e| format!("could not run tar: {e}"))?;
    let _ = std::fs::remove_file(&archive);

    if !output.status.success() {
        return Err(format!(
            "could not unpack Volta: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    let volta = bin.join("volta");
    if !volta.exists() {
        return Err("Volta unpacked but its binary is missing".into());
    }

    let setup = Command::new(&volta)
        .arg("setup")
        .output()
        .map_err(|e| format!("could not run volta setup: {e}"))?;
    if !setup.status.success() {
        return Err(format!(
            "volta setup failed: {}",
            String::from_utf8_lossy(&setup.stderr).trim()
        ));
    }

    Ok(volta)
}

pub fn volta_target() -> Result<&'static str, String> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", _) => Ok("macos"),
        ("linux", "x86_64") => Ok("linux"),
        ("linux", "aarch64") => Ok("linux-arm"),
        (os, arch) => Err(format!("Volta has no build for {os} {arch}")),
    }
}

pub fn download_url(version: &str, target: &str) -> String {
    format!("{RELEASE_BASE}/v{version}/volta-{version}-{target}.tar.gz")
}

fn latest_version() -> Result<String, String> {
    let body = agent()
        .get(LATEST_VERSION_URL)
        .call()
        .map_err(|e| format!("could not reach volta.sh: {e}"))?
        .into_string()
        .map_err(|e| format!("could not read the Volta version: {e}"))?;
    let version = body.trim().trim_start_matches('v').to_string();
    if version.is_empty() {
        return Err("volta.sh returned no version".into());
    }
    Ok(version)
}

fn download(url: &str) -> Result<Vec<u8>, String> {
    let resp = agent()
        .get(url)
        .call()
        .map_err(|e| format!("could not download Volta: {e}"))?;
    let mut bytes = Vec::new();
    resp.into_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| format!("could not download Volta: {e}"))?;
    if bytes.is_empty() {
        return Err("the Volta download came back empty".into());
    }
    Ok(bytes)
}

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout(Duration::from_secs(120))
        .user_agent("curie-skills-manager")
        .build()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_this_machine_to_a_published_target() {
        let target = volta_target().expect("supported target");
        assert!(["macos", "linux", "linux-arm"].contains(&target));
    }

    #[test]
    fn builds_the_release_url_the_way_volta_publishes_it() {
        assert_eq!(
            download_url("2.0.2", "linux-arm"),
            "https://github.com/volta-cli/volta/releases/download/v2.0.2/volta-2.0.2-linux-arm.tar.gz"
        );
    }

    #[test]
    #[ignore = "hits the network and downloads a few MB"]
    fn downloads_the_release_for_every_target_curie_ships() {
        let version = latest_version().expect("version");
        assert!(version.starts_with(char::is_numeric), "got {version}");
        for target in ["macos", "linux", "linux-arm"] {
            let bytes = download(&download_url(&version, target)).expect(target);
            assert!(
                bytes.len() > 1_000_000,
                "{target} came back as {} bytes",
                bytes.len()
            );
            assert_eq!(&bytes[..2], b"\x1f\x8b", "{target} is not a gzip archive");
        }
    }
}

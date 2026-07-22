use curie_lib::detect_node_info;

fn main() {
    println!("== curie environment check ==");
    println!();

    let locale = std::process::Command::new("locale")
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "unknown".to_string());
    println!("locale:     {locale}");

    match detect_node_info() {
        Ok(info) => {
            println!(
                "node:       {}",
                if info.installed { "installed" } else { "NOT FOUND" }
            );
            println!("version:    {}", info.version.as_deref().unwrap_or("—"));
            println!("path:       {}", info.path.as_deref().unwrap_or("—"));
            println!(
                "manager:    {}",
                info.manager.as_deref().unwrap_or("—")
            );
        }
        Err(e) => {
            println!("node:       error");
            println!("message:    {e}");
        }
    }

    println!();
    println!("(this binary lives in src-tauri/examples/check.rs)");
}
use curie_lib::install_node_impl;

fn main() {
    println!("== curie installer (headless) ==");
    println!();

    let result = install_node_impl(|stage, message, done| {
        let marker = if done { "✓" } else { "•" };
        println!("  [{marker}] {stage:<10} {message}");
    });

    println!();
    match result {
        Ok(()) => {
            println!("install completed.");
            println!();
            println!("verify with:");
            println!("  cargo run --example check");
        }
        Err(e) => {
            eprintln!("install failed: {e}");
            std::process::exit(1);
        }
    }
}
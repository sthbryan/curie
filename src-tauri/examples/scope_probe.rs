use curie_lib::{check_skill_updates_in, list_skills_in, Scope};

fn main() {
    let project = std::env::args().nth(1).expect("usage: scope_probe <dir>");

    let global = list_skills_in(&Scope::resolve(None).unwrap()).unwrap();
    println!("global: {} skills", global.len());

    let scope = Scope::resolve(Some(project.clone())).unwrap();
    let scoped = list_skills_in(&scope).unwrap();
    println!("project {project}: {} skills", scoped.len());
    for s in &scoped {
        println!("  {} scope={} agents={:?}", s.name, s.scope, s.agents);
    }

    let global_updates = check_skill_updates_in(&Scope::resolve(None).unwrap()).unwrap();
    println!(
        "global updates: {} entries, {} checkable",
        global_updates.len(),
        global_updates.iter().filter(|u| u.checkable).count()
    );

    let project_updates = check_skill_updates_in(&scope).unwrap();
    println!(
        "project updates: {} entries, {} checkable",
        project_updates.len(),
        project_updates.iter().filter(|u| u.checkable).count()
    );
    for u in &project_updates {
        println!("  {} checkable={} available={}", u.name, u.checkable, u.update_available);
    }

    match Scope::resolve(Some("/definitely/not/here".into())) {
        Ok(_) => println!("BAD: a missing folder resolved"),
        Err(e) => println!("missing folder rejected: {e}"),
    }
}

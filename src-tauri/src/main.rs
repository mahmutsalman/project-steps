#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;

use database::{Database, Project, Step, Note};
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppState {
    db: Mutex<Database>,
}

#[tauri::command]
fn get_all_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let db = state.db.lock().unwrap();
    db.get_all_projects().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_project(project: Project, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.create_project(&project).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_project(project: Project, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.update_project(&project).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_project(project_id: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.delete_project(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_all_steps(state: State<AppState>) -> Result<Vec<Step>, String> {
    let db = state.db.lock().unwrap();
    db.get_all_steps().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_steps_by_project(project_id: String, state: State<AppState>) -> Result<Vec<Step>, String> {
    let db = state.db.lock().unwrap();
    db.get_steps_by_project(&project_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_step(step: Step, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.create_step(&step).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_step(step: Step, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.update_step(&step).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_steps_batch(steps: Vec<Step>, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.update_steps_batch(&steps).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_project_current_step(project_id: String, step_id: Option<String>, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.update_project_current_step(&project_id, step_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_step(step_id: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.delete_step(&step_id).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
fn get_notes_by_project(projectId: String, state: State<AppState>) -> Result<Vec<Note>, String> {
    println!("get_notes_by_project called with projectId: {}", projectId);
    let db = state.db.lock().unwrap();
    db.get_notes_by_project(&projectId).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_note(note: Note, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.create_note(&note).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_note(note: Note, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.update_note(&note).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
fn delete_note(noteId: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.delete_note(&noteId).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db_path = if cfg!(debug_assertions) {
                // Development: use specific project folder path
                std::path::PathBuf::from("/Users/mahmutsalman/Documents/MyCodingProjects/Projects/Efficinecy apps/ProjectSteps/local.db")
            } else {
                // Production: use Application Support
                let app_dir = app.path().app_data_dir().expect("Failed to get app data dir");
                std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
                app_dir.join("projectsteps.db")
            };
            
            println!("Database path: {}", db_path.display());
            let database = Database::new(&db_path).expect("Failed to initialize database");
            
            app.manage(AppState {
                db: Mutex::new(database),
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_all_projects,
            create_project,
            update_project,
            delete_project,
            get_all_steps,
            get_steps_by_project,
            create_step,
            update_step,
            update_steps_batch,
            update_project_current_step,
            delete_step,
            get_notes_by_project,
            create_note,
            update_note,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
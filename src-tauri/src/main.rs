#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;

use database::{Database, Project, Step, Note, ImageAttachment};
use std::sync::Mutex;
use std::fs;
use std::path::Path;
use tauri::{Manager, State};
use uuid::Uuid;
use chrono::Utc;

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
#[allow(non_snake_case)]
fn delete_step(stepId: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.delete_step(&stepId).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
fn get_notes_by_project(projectId: String, state: State<AppState>) -> Result<Vec<Note>, String> {
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

#[tauri::command]
#[allow(non_snake_case)]
fn get_important_note(projectId: String, state: State<AppState>) -> Result<Option<Note>, String> {
    let db = state.db.lock().unwrap();
    db.get_important_note(&projectId).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
fn set_important_note(projectId: String, noteId: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.set_important_note(&projectId, &noteId).map_err(|e| e.to_string())
}

#[tauri::command]
fn upload_image(
    image_data: Vec<u8>,
    filename: String,
    content_type: String,
    content_id: String,
    content_type_enum: String,
    app: tauri::AppHandle,
    state: State<AppState>
) -> Result<ImageAttachment, String> {
    // Generate unique ID for the image
    let image_id = Uuid::new_v4().to_string();
    
    // Determine attachment folder path
    let attachment_dir = if cfg!(debug_assertions) {
        // Development: use project folder
        std::path::PathBuf::from("/Users/mahmutsalman/Documents/MyCodingProjects/Projects/Efficinecy apps/ProjectSteps/attachmentSources/images")
    } else {
        // Production: use Application Support
        let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        app_dir.join("attachmentSources").join("images")
    };
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&attachment_dir).map_err(|e| e.to_string())?;
    
    // Generate unique filename with extension
    let file_extension = Path::new(&filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("png");
    let unique_filename = format!("{}_{}.{}", image_id, filename.replace(".", "_"), file_extension);
    let file_path = attachment_dir.join(&unique_filename);
    
    // Write image data to file
    fs::write(&file_path, image_data).map_err(|e| e.to_string())?;
    
    // Create image attachment record
    let attachment = ImageAttachment {
        id: image_id,
        file_path: file_path.to_string_lossy().to_string(),
        filename: unique_filename,
        content_type,
        content_id,
        content_type_enum,
        created_at: Utc::now().to_rfc3339(),
    };
    
    // Save to database
    let db = state.db.lock().unwrap();
    db.create_image_attachment(&attachment).map_err(|e| e.to_string())?;
    
    Ok(attachment)
}

#[tauri::command]
fn get_image_attachments(
    content_id: String,
    content_type_enum: String,
    state: State<AppState>
) -> Result<Vec<ImageAttachment>, String> {
    let db = state.db.lock().unwrap();
    db.get_image_attachments_by_content(&content_id, &content_type_enum)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_image_attachment(
    attachment_id: String,
    file_path: String,
    state: State<AppState>
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    
    // Delete file
    if Path::new(&file_path).exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    
    // Delete from database
    db.delete_image_attachment(&attachment_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_image_file_data(file_path: String) -> Result<Vec<u8>, String> {
    fs::read(&file_path).map_err(|e| e.to_string())
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
            delete_note,
            get_important_note,
            set_important_note,
            upload_image,
            get_image_attachments,
            delete_image_attachment,
            get_image_file_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
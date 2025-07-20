use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub gradient: String,
    #[serde(rename = "currentStepId")]
    pub current_step_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Step {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "plainText")]
    pub plain_text: Option<String>,
    pub order_index: i32,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: String,
    pub title: String,
    pub content: String,
    #[serde(rename = "plainText")]
    pub plain_text: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageAttachment {
    pub id: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    pub filename: String,
    #[serde(rename = "contentType")]
    pub content_type: String,
    #[serde(rename = "contentId")]
    pub content_id: String,
    #[serde(rename = "contentTypeEnum")]
    pub content_type_enum: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let is_new_db = !db_path.exists();
        let conn = Connection::open(db_path)?;
        
        // Create schema version table first
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY
            )",
            [],
        )?;
        
        let current_version = Self::get_schema_version(&conn)?;
        println!("Database version: {}", current_version);
        
        if is_new_db {
            println!("Creating new database at: {}", db_path.display());
            Self::create_initial_schema(&conn)?;
            Self::set_schema_version(&conn, 5)?;
        } else {
            println!("Using existing database at: {}", db_path.display());
            Self::apply_migrations(&conn, current_version)?;
        }

        Ok(Database { conn })
    }
    
    fn get_schema_version(conn: &Connection) -> Result<i32> {
        let version: i32 = conn.query_row(
            "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1",
            [],
            |row| row.get(0)
        ).unwrap_or(0);
        Ok(version)
    }
    
    fn set_schema_version(conn: &Connection, version: i32) -> Result<()> {
        conn.execute(
            "INSERT OR REPLACE INTO schema_version (version) VALUES (?1)",
            [version],
        )?;
        Ok(())
    }
    
    fn create_initial_schema(conn: &Connection) -> Result<()> {
        conn.execute(
            "CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                gradient TEXT NOT NULL,
                current_step_id TEXT
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE steps (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                plain_text TEXT,
                order_index INTEGER NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE notes (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                plain_text TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE image_attachments (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                content_id TEXT NOT NULL,
                content_type_enum TEXT NOT NULL CHECK (content_type_enum IN ('step', 'note', 'project_description')),
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        
        println!("Initial database schema created successfully");
        Ok(())
    }
    
    fn apply_migrations(conn: &Connection, current_version: i32) -> Result<()> {
        let latest_version = 5; // Update this when adding new migrations
        
        if current_version < latest_version {
            println!("Applying database migrations from version {} to {}", current_version, latest_version);
            
            if current_version < 2 {
                conn.execute("ALTER TABLE projects ADD COLUMN current_step_id TEXT", [])?;
                Self::set_schema_version(conn, 2)?;
            }
            
            if current_version < 3 {
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS notes (
                        id TEXT PRIMARY KEY,
                        project_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        content TEXT NOT NULL,
                        plain_text TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                    )",
                    [],
                )?;
                Self::set_schema_version(conn, 3)?;
            }
            
            if current_version < 4 {
                conn.execute("ALTER TABLE steps ADD COLUMN plain_text TEXT", [])?;
                Self::set_schema_version(conn, 4)?;
            }
            
            if current_version < 5 {
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS image_attachments (
                        id TEXT PRIMARY KEY,
                        file_path TEXT NOT NULL,
                        filename TEXT NOT NULL,
                        content_type TEXT NOT NULL,
                        content_id TEXT NOT NULL,
                        content_type_enum TEXT NOT NULL CHECK (content_type_enum IN ('step', 'note', 'project_description')),
                        created_at TEXT NOT NULL
                    )",
                    [],
                )?;
                Self::set_schema_version(conn, 5)?;
            }
            
            println!("Database migrations completed");
        } else {
            println!("Database is up to date (version {})", current_version);
        }
        
        Ok(())
    }

    pub fn get_all_projects(&self) -> Result<Vec<Project>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, created_at, updated_at, gradient, current_step_id FROM projects ORDER BY created_at DESC"
        )?;
        
        let projects = stmt.query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                gradient: row.get(5)?,
                current_step_id: row.get(6)?,
            })
        })?;

        projects.collect()
    }

    pub fn create_project(&self, project: &Project) -> Result<()> {
        let current_step_id = project.current_step_id.as_deref().unwrap_or("");
        self.conn.execute(
            "INSERT INTO projects (id, name, description, created_at, updated_at, gradient, current_step_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [&project.id, &project.name, &project.description, &project.created_at, &project.updated_at, &project.gradient, current_step_id],
        )?;
        Ok(())
    }

    pub fn update_project(&self, project: &Project) -> Result<()> {
        let current_step_id = project.current_step_id.as_deref().unwrap_or("");
        self.conn.execute(
            "UPDATE projects SET name = ?1, description = ?2, updated_at = ?3, gradient = ?4, current_step_id = ?5 WHERE id = ?6",
            [&project.name, &project.description, &project.updated_at, &project.gradient, current_step_id, &project.id],
        )?;
        Ok(())
    }

    pub fn delete_project(&self, project_id: &str) -> Result<()> {
        // Delete all steps for this project first
        self.conn.execute(
            "DELETE FROM steps WHERE project_id = ?1",
            [project_id],
        )?;
        
        // Then delete the project
        self.conn.execute(
            "DELETE FROM projects WHERE id = ?1",
            [project_id],
        )?;
        Ok(())
    }

    pub fn update_project_current_step(&self, project_id: &str, step_id: Option<&str>) -> Result<()> {
        self.conn.execute(
            "UPDATE projects SET current_step_id = ?1 WHERE id = ?2",
            [step_id.unwrap_or(""), project_id],
        )?;
        Ok(())
    }

    pub fn get_steps_by_project(&self, project_id: &str) -> Result<Vec<Step>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, title, description, plain_text, order_index, completed, created_at, updated_at 
             FROM steps WHERE project_id = ?1 ORDER BY order_index"
        )?;
        
        let steps = stmt.query_map([project_id], |row| {
            Ok(Step {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                plain_text: row.get(4)?,
                order_index: row.get(5)?,
                completed: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        steps.collect()
    }

    pub fn get_all_steps(&self) -> Result<Vec<Step>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, title, description, plain_text, order_index, completed, created_at, updated_at 
             FROM steps ORDER BY project_id, order_index"
        )?;
        
        let steps = stmt.query_map([], |row| {
            Ok(Step {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                plain_text: row.get(4)?,
                order_index: row.get(5)?,
                completed: row.get::<_, i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        steps.collect()
    }

    pub fn create_step(&self, step: &Step) -> Result<()> {
        self.conn.execute(
            "INSERT INTO steps (id, project_id, title, description, plain_text, order_index, completed, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            [
                &step.id, 
                &step.project_id, 
                &step.title, 
                &step.description,
                step.plain_text.as_deref().unwrap_or(""),
                &step.order_index.to_string(),
                &(if step.completed { "1" } else { "0" }).to_string(),
                &step.created_at, 
                &step.updated_at
            ],
        )?;
        Ok(())
    }

    pub fn update_step(&self, step: &Step) -> Result<()> {
        self.conn.execute(
            "UPDATE steps SET title = ?1, description = ?2, plain_text = ?3, order_index = ?4, completed = ?5, updated_at = ?6 
             WHERE id = ?7",
            [
                &step.title,
                &step.description,
                step.plain_text.as_deref().unwrap_or(""),
                &step.order_index.to_string(),
                &(if step.completed { "1" } else { "0" }).to_string(),
                &step.updated_at,
                &step.id,
            ],
        )?;
        Ok(())
    }

    pub fn update_steps_batch(&self, steps: &[Step]) -> Result<()> {
        let tx = self.conn.unchecked_transaction()?;
        
        for step in steps {
            tx.execute(
                "UPDATE steps SET title = ?1, description = ?2, plain_text = ?3, order_index = ?4, completed = ?5, updated_at = ?6 
                 WHERE id = ?7",
                [
                    &step.title,
                    &step.description,
                    step.plain_text.as_deref().unwrap_or(""),
                    &step.order_index.to_string(),
                    &(if step.completed { "1" } else { "0" }).to_string(),
                    &step.updated_at,
                    &step.id,
                ],
            )?;
        }
        
        tx.commit()?;
        Ok(())
    }

    pub fn delete_step(&self, step_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM steps WHERE id = ?1",
            [step_id],
        )?;
        Ok(())
    }

    // Notes CRUD operations
    pub fn get_notes_by_project(&self, project_id: &str) -> Result<Vec<Note>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, project_id, title, content, plain_text, created_at, updated_at 
             FROM notes WHERE project_id = ?1 ORDER BY created_at DESC"
        )?;
        
        let notes = stmt.query_map([project_id], |row| {
            Ok(Note {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                plain_text: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        notes.collect()
    }

    pub fn create_note(&self, note: &Note) -> Result<()> {
        self.conn.execute(
            "INSERT INTO notes (id, project_id, title, content, plain_text, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &note.id,
                &note.project_id,
                &note.title,
                &note.content,
                &note.plain_text,
                &note.created_at,
                &note.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_note(&self, note: &Note) -> Result<()> {
        self.conn.execute(
            "UPDATE notes SET title = ?1, content = ?2, plain_text = ?3, updated_at = ?4 
             WHERE id = ?5",
            [
                &note.title,
                &note.content,
                &note.plain_text,
                &note.updated_at,
                &note.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_note(&self, note_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM notes WHERE id = ?1",
            [note_id],
        )?;
        Ok(())
    }

    // Image Attachments CRUD operations
    pub fn get_image_attachments_by_content(&self, content_id: &str, content_type_enum: &str) -> Result<Vec<ImageAttachment>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, file_path, filename, content_type, content_id, content_type_enum, created_at 
             FROM image_attachments WHERE content_id = ?1 AND content_type_enum = ?2 ORDER BY created_at ASC"
        )?;
        
        let attachments = stmt.query_map([content_id, content_type_enum], |row| {
            Ok(ImageAttachment {
                id: row.get(0)?,
                file_path: row.get(1)?,
                filename: row.get(2)?,
                content_type: row.get(3)?,
                content_id: row.get(4)?,
                content_type_enum: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        attachments.collect()
    }

    pub fn create_image_attachment(&self, attachment: &ImageAttachment) -> Result<()> {
        self.conn.execute(
            "INSERT INTO image_attachments (id, file_path, filename, content_type, content_id, content_type_enum, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &attachment.id,
                &attachment.file_path,
                &attachment.filename,
                &attachment.content_type,
                &attachment.content_id,
                &attachment.content_type_enum,
                &attachment.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn delete_image_attachment(&self, attachment_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM image_attachments WHERE id = ?1",
            [attachment_id],
        )?;
        Ok(())
    }

    pub fn delete_image_attachments_by_content(&self, content_id: &str, content_type_enum: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM image_attachments WHERE content_id = ?1 AND content_type_enum = ?2",
            [content_id, content_type_enum],
        )?;
        Ok(())
    }
}
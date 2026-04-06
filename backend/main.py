from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List
import os

from backend.database import init_db, get_db
from backend.models import OpportunityCreate, OpportunityResponse, ServiceRequestCreate, ServiceRequestResponse

app = FastAPI(title="Career Motive API")

# Initialize database
init_db()

# Admin secret key (In production, use env variable)
ADMIN_SECRET_KEY = "supersecret123"
STAFF_SECRET_KEY = "staff123"

# Allow CORS if needed (for separate frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API ROUTES ---

@app.get("/api/opportunities", response_model=List[OpportunityResponse])
def get_opportunities(category: str = None):
    conn = get_db()
    import psycopg2.extras
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    if category and category != "All":
        cursor.execute("SELECT * FROM opportunities WHERE category = %s ORDER BY created_at DESC", (category,))
    else:
        cursor.execute("SELECT * FROM opportunities ORDER BY created_at DESC")
        
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        d['created_at'] = str(d['created_at'])
        results.append(d)
        
    return [OpportunityResponse(**d) for d in results]

@app.post("/api/opportunities")
def create_opportunity(opp: OpportunityCreate):
    if opp.admin_secret not in (ADMIN_SECRET_KEY, STAFF_SECRET_KEY):
        raise HTTPException(status_code=403, detail="Invalid admin or staff secret key")
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO opportunities (title, description, category, deadline, url) VALUES (%s, %s, %s, %s, %s)",
        (opp.title, opp.description, opp.category, opp.deadline, opp.url)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Opportunity created successfully"}

@app.put("/api/opportunities/{id}")
def update_opportunity(id: int, opp: OpportunityCreate):
    if opp.admin_secret not in (ADMIN_SECRET_KEY, STAFF_SECRET_KEY):
        raise HTTPException(status_code=403, detail="Invalid admin or staff secret key")
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE opportunities SET title=%s, description=%s, category=%s, deadline=%s, url=%s WHERE id=%s",
        (opp.title, opp.description, opp.category, opp.deadline, opp.url, id)
    )
    conn.commit()
    conn.close()
    
    return {"message": "Opportunity updated successfully"}

@app.delete("/api/opportunities/{id}")
def delete_opportunity(id: int, admin_secret: str):
    if admin_secret not in (ADMIN_SECRET_KEY, STAFF_SECRET_KEY):
        raise HTTPException(status_code=403, detail="Invalid admin or staff secret key")
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM opportunities WHERE id=%s", (id,))
    conn.commit()
    conn.close()
    
    return {"message": "Opportunity deleted successfully"}

# --- SERVICE REQUEST ROUTES ---

@app.get("/api/requests", response_model=List[ServiceRequestResponse])
def get_requests():
    conn = get_db()
    import psycopg2.extras
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM service_requests ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        d['created_at'] = str(d['created_at'])
        results.append(d)
        
    return [ServiceRequestResponse(**d) for d in results]

@app.post("/api/requests")
def create_request(req: ServiceRequestCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO service_requests (name, email, service, message) VALUES (%s, %s, %s, %s)",
        (req.name, req.email, req.service, req.message)
    )
    conn.commit()
    conn.close()
    return {"message": "Request saved successfully"}

# --- STATIC FILES ---
# Mount the frontend directory to serve HTML, CSS, JS
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(frontend_path, 'index.html'))

@app.get("/admin")
def serve_admin():
    return FileResponse(os.path.join(frontend_path, 'admin.html'))

@app.get("/services")
def serve_services():
    return FileResponse(os.path.join(frontend_path, 'services.html'))

app.mount("/static", StaticFiles(directory=frontend_path), name="static")

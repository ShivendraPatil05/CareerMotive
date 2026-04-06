from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OpportunityCreate(BaseModel):
    title: str
    description: str
    category: str
    deadline: Optional[str] = None
    url: str
    admin_secret: str

class OpportunityResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    deadline: Optional[str] = None
    url: str
    created_at: str

    class Config:
        from_attributes = True

class ServiceRequestCreate(BaseModel):
    name: str
    email: str
    service: str
    message: str

class ServiceRequestResponse(ServiceRequestCreate):
    id: int
    created_at: str

    class Config:
        from_attributes = True

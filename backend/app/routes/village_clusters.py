from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.case import VillageCluster
from app.models.user import User
from app.routes.deps import get_current_user

router = APIRouter(prefix="/village-radar", tags=["Village Disease Early Warning Network"])


class StatusUpdateRequest(BaseModel):
    status: str  # "SUSPECTED", "UNDER_VERIFICATION", "CONFIRMED"


@router.get("/clusters", summary="Get village disease clusters for early warning")
def get_clusters(
    district: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(VillageCluster)
    if district:
        query = query.filter(VillageCluster.district.ilike(f"%{district}%"))
    if status:
        query = query.filter(VillageCluster.status == status)
    
    clusters = query.order_by(VillageCluster.cases_count.desc()).all()
    return {
        "is_synthetic_mode": True,
        "banner_notice": "DEMO MODE: SYNTHETIC DATA FOR EARLY WARNING DEMONSTRATION",
        "clusters": clusters,
    }


@router.post("/clusters/{cluster_id}/verify", summary="Update cluster verification status")
def verify_cluster(
    cluster_id: str,
    req: StatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cluster = db.query(VillageCluster).filter(VillageCluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    cluster.status = req.status
    if req.status == "CONFIRMED":
        cluster.risk_level = "HIGH"
    elif req.status == "UNDER_VERIFICATION":
        cluster.risk_level = "MEDIUM"
        
    db.commit()
    db.refresh(cluster)
    return cluster

from sqlalchemy import Column, Integer, String, Boolean

from app.db import Base


class Vet(Base):
    __tablename__ = "vets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="vet")  # vet, para_vet
    phone = Column(String(20), nullable=False)
    district = Column(String(50), nullable=False, index=True)
    sub_district = Column(String(50), nullable=True)
    specialization = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)

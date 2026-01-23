from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import math
import numpy as np
from datetime import datetime, timedelta

app = FastAPI()

# Allow CORS from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DeclineInput(BaseModel):
    t1: float
    q1: float
    t2: float
    q2: float
    original_q: List[float]  
    decline_type: str
    start_date: str 
    qf: float

@app.post("/calculate")
def calculate_decline(data: DeclineInput):
    t1, q1, t2, q2 = data.t1, data.q1, data.t2, data.q2
    decline_type = data.decline_type.lower()
    qf = data.qf

    result = []
    t_range = np.arange(t1, t2 + 1, 1)
    t_final = None 
    start_date = datetime.strptime(data.start_date, "%Y-%m-%d")

    if decline_type == "exponential":
        D = (math.log(q1 / q2)) / (t2 - t1 + 1)
        for t in t_range:
            qt = q1 * math.exp(-D * (t - t1))
            date = (start_date + timedelta(days=int(t))).strftime("%Y-%m-%d")
            result.append({"t": float(t), "qt": qt, "date": date})
        t = t2 + 1
        while True:
            qt = q1 * math.exp(-D * (t - t1))
            if qt <= qf:
                t_final = t
                break
            date = (start_date + timedelta(days=int(t))).strftime("%Y-%m-%d")
            result.append({"t": float(t), "qt": qt, "date": date})
            t += 1
        Np_extrapolated = q2 / D

    elif decline_type == "harmonic":
        D = (q1 - q2) / (q2 * (t2 - t1))
        for t in t_range:
            qt = q1 / (1 + D * (t - t1))
            date = (start_date + timedelta(days=int(t))).strftime("%Y-%m-%d")
            result.append({"t": float(t), "qt": qt, "date": date})
        t = t2 + 1
        while True:
            qt = q1 / (1 + D * (t - t1))
            if qt <= qf:
                t_final = t
                break
            date = (start_date + timedelta(days=int(t))).strftime("%Y-%m-%d")
            result.append({"t": float(t), "qt": qt, "date": date})
            t += 1
        Np_extrapolated = (q2 / D) * math.log(q2 / qf)

    elif decline_type == "hyperbolic":
        b = 0.5
        D = ((q1 / q2) ** b - 1) / (b * (t2 - t1))
        for t in t_range:
            qt = q1 / ((1 + b * D * (t - t1)) ** (1 / b))
            date = (start_date + timedelta(days=int(t))).strftime("%Y-%m-%d")
            result.append({"t": float(t), "qt": qt, "date": date})
        t = t2 + 1
        while True:
            qt = q1 / ((1 + b * D * (t - t1)) ** (1 / b))
            if qt <= qf:
                t_final = t
                break
            date = (start_date + timedelta(days=int(t))).strftime("%Y-%m-%d")
            result.append({"t": float(t), "qt": qt, "date": date})
            t += 1
        Np_extrapolated = (q2 ** b) / (D * (1 - b)) * (q2 ** (1 - b) - qf ** (1 - b)) if b != 1 else float("inf")

    else:
        return {"error": "Invalid decline type"}

    original_q = data.original_q
    Np_observed = sum(q / 1_000_000 for q in original_q[:int(t2)])
    Np_total = Np_observed + Np_extrapolated / 1_000_000
    final_date = (start_date + timedelta(days=t_final)).strftime("%Y-%m-%d")

    return {
        "D": D,
        "curve": result,
        "Np_observed": Np_observed,
        "Np_extrapolated": Np_extrapolated / 1_000_000,
        "Np_total": Np_total,
        "date_final": final_date
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

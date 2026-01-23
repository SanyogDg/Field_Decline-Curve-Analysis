# 📉 Decline Curve Analysis Tool

An interactive web application for analyzing oil & gas well production decline using **Exponential**, **Harmonic**, and **Hyperbolic** models.
🌐 **Live Demo**: [field-decline-curve-analysis-123.onrender.com](https://field-decline-curve-analysis-123.onrender.com/)

## 🛠️ Tech Stack

- **Frontend:** React.js, Chakra UI, Plotly.js
- **Backend:** FastAPI (Python)
- **Data Input:** Excel (.xlsx or .xls)

---

## 🚀 Features

- 📁 Upload Excel file (`Date` & `FlowRate`)
- 📊 Plot Flow Rate vs Time
- 🔍 Select any two points to fit a decline model or Select a region using Laso Tool.
- 📉 Choose decline type:  
  - Exponential  
  - Harmonic  
  - Hyperbolic  
- ⛽ Set custom cutoff flow rate (`qf`) for extrapolation
- 📆 Get estimated date when flow falls to cutoff
- 📈 Plot:
  - Flow Rate vs Time
  - Flow Rate vs Cumulative Production
- 📦 View:
  - Cumulative Production (`Np_observed`, `Np_extrapolated`, `Np_total`)

---

## 📁 Excel File Format

| Date       | FlowRate |
|------------|----------|
| 01-01-2022 | 1200     |
| 02-01-2022 | 1150     |
| ...        | ...      |

- `Date`: Can be Excel date code or `DD-MM-YYYY`
- `FlowRate`: Numeric value(bbl/day)

---

## ⚙️ Running the App Locally
### 🧠 Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
### 🧠 Fronend (React)
```bash
npm install
npm run dev
Environment Variable
Create a .env file inside frontend/:

env
Copy
Edit
VITE_API_BASE_URL=http://localhost:8000
```
### Some Screenshots
![image](https://github.com/user-attachments/assets/37bc5cac-98ea-4657-83b9-193f4aaa7657)
![image](https://github.com/user-attachments/assets/84050abc-705d-4e39-ae10-c52d51d9c55f)
![image](https://github.com/user-attachments/assets/9c351fce-fdc1-47b9-8857-5d94cb59556d)

### Thank You

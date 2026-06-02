# Nagar Nigam Complaint Tracker (React + Bootstrap + Servlet/JSP + MySQL)

Stack (as per your requirement):
- Frontend: **React + Vite + Bootstrap**
- Backend: **Tomcat 10 (Jakarta) + Servlets + HTTP Session**
- Database: **MySQL**
- Extra: **Language switch (EN/HI)**, **Geolocation**, **File attachments**

## 1) Database setup (MySQL)
1. Start MySQL
2. Run this SQL:
   - `db/schema.sql`

DB user/pass (as you asked):
- username: `root`
- password: `root`

Default admin user (created by schema):
- email: `admin@nagar-nigam.local`
- password: `admin123`

## 2) Backend (Tomcat 10)
Path: `backend/`

### Build WAR
```bash
mvn clean package
```

WAR output:
`backend/target/nagar-nigam-backend.war`

### Deploy on Tomcat
Copy `nagar-nigam-backend.war` into:
`$TOMCAT_HOME/webapps/`

Backend URLs (when deployed):
- `http://localhost:8080/nagar-nigam-backend/`
- API base: `http://localhost:8080/nagar-nigam-backend/api`

Uploads directory (server-side):
- Config: `backend/src/main/resources/db.properties`
- Default: `${catalina.base}/nagar-nigam-uploads`

## 3) Frontend (React)
Path: `frontend/`

Install & run:
```bash
npm install
npm run dev
```

Open:
- `http://localhost:5173`

### Proxy setup
`vite.config.js` proxies `/api` → `http://localhost:8080/nagar-nigam-backend/api`

## 4) Main features
- Complaint register (category/description/address/ward + location + attachments)
- Tracking by code format: `NN-YYYY-000001`
- User registration/login (session-based)
- Admin dashboard: list by status + update status with comment


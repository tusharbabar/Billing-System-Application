# 🚀 Deployment Guide: Krushi Seva Kendra Billing System

To take your billing system live, follow these steps to host your Database, Backend, and Frontend.

---

## 1. Database (MySQL)
Your project uses MySQL. You need a cloud-hosted MySQL database.

### Option: Aiven (Free Tier)
1. Sign up at [Aiven.io](https://aiven.io/).
2. Create a **MySQL** service (choose the free plan).
3. Once active, go to "Connection Information" and note:
   - **Host**
   - **Port** (usually 3306)
   - **User** (usually avnadmin)
   - **Password**
4. Use these in your Backend environment variables.

---

## 2. Backend (Node.js/Express)
Host your backend on **Render.com**.

1. Create a free account on [Render](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Environment Variables** (Add these in the Render dashboard):
   - `DB_HOST`: (From Aiven)
   - `DB_USER`: (From Aiven)
   - `DB_PASSWORD`: (From Aiven)
   - `DB_NAME`: `defaultdb` (or whatever your Aiven DB name is)
   - `DB_PORT`: `3306`
   - `JWT_SECRET`: `your_random_secure_secret_key`
   - `FRONTEND_URL`: `https://your-frontend-url.vercel.app` (Add this *after* deploying frontend)

---

## 3. Frontend (React/Vite)
Host your frontend on **Vercel**.

1. Create an account on [Vercel](https://vercel.com/).
2. Click **Add New** > **Project**.
3. Connect your GitHub repository.
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api` (Get this from your Render dashboard)

---

## 🛠️ Code Changes Made
I have already prepared your code for deployment:
1.  **Frontend**: Updated `axios.js` to use `import.meta.env.VITE_API_URL`.
2.  **Backend**: Updated `server.js` to allow CORS from your production `FRONTEND_URL`.
3.  **Vercel**: Added `vercel.json` to handle React Router paths correctly.

## 📝 Post-Deployment Note
After you deploy the backend, copy its URL and add it to Vercel's `VITE_API_URL`.
After you deploy the frontend, copy its URL and add it to Render's `FRONTEND_URL`.

# 📰 FairNews – News Bias Detection UI

FairNews is a frontend web application built using **React + Vite + TypeScript** that analyzes news articles and detects potential bias using an external NLP-based backend pipeline.

The application allows users to input a news article URL and receive bias analysis results in a clean and user-friendly interface.

---

## 🚀 Live Demo

Deployed on Vercel:

👉 https://fair-news-cvsazvpdm-dipti-patils-projects-ecc04a97.vercel.app/

---

## 🛠️ Tech Stack

* ⚛️ React
* ⚡ Vite
* 🟦 TypeScript
* 🎨 Tailwind CSS
* 🌐 REST API Integration
* 🚀 Vercel (Deployment)

---

## 📂 Project Structure

```
src/
 ├── components/
 ├── pages/
 ├── styles/
 ├── main.tsx
 └── App.tsx

public/
package.json
vite.config.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```
VITE_PIPELINE_GATEWAY_URL=your-backend-api-url
```

⚠️ Note:
All Vite environment variables must start with `VITE_`.

---

## 🧪 Run Locally

1. Clone the repository:

```
git clone https://github.com/your-username/FairNews.git
```

2. Navigate to project folder:

```
cd FairNews
```

3. Install dependencies:

```
npm install
```

4. Start development server:

```
npm run dev
```

App will run at:

```
http://localhost:5173
```

---

## 🏗️ Build for Production

```
npm run build
```

Build output will be generated inside:

```
dist/
```

---

## 🚀 Deployment

The project is deployed using **Vercel**.

Deployment workflow:

```
Edit → git add → git commit → git push → Auto Deploy
```

Vercel automatically:

* Installs dependencies
* Runs build
* Deploys the app

---

## 🔐 Security Notes

* `.env` is ignored using `.gitignore`
* `node_modules` and `dist` are not committed
* Environment variables are configured in Vercel dashboard

---

## 📌 Features

* News article URL input
* API integration for bias scoring
* Clean and responsive UI
* Real-time analysis display
* Error handling and loading states

---

## 📈 Future Improvements

* Sentiment visualization charts
* Source credibility scoring
* News category filtering
* User authentication
* Dashboard analytics

---

## 👩‍💻 Author

Dipti Patil

---

## 📄 License

This project is for educational and research purposes.

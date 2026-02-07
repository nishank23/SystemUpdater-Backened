# 🚀 System Updater Backend

This repository contains the **backend service** for an Android **System Updater App** that delivers **A/B (seamless) OTA update configurations** to system-level Android applications.

The backend provides OTA metadata via APIs and uses **WebSockets** to notify connected devices **instantly** when a new update is available — eliminating the need for periodic polling.

---

## ⭐ Key Highlights

- Backend-driven OTA update configuration
- Real-time update notifications using **WebSockets**
- No polling required on client devices
- Designed for Android **system / privileged apps**
- Suitable for custom ROMs and OEM environments
- Secure environment-based configuration

---

## 🔍 What This Backend Does

- Manages OTA update metadata (version, URL, type, slot behavior)
- Serves update configurations to Android clients
- Notifies connected clients **immediately** when a new update is published
- Acts as the control layer for Android `update_engine`–based updates

---

## 🔄 Real-Time Update Flow (WebSocket)

1. Android system app connects to backend via WebSocket
2. Backend keeps the connection alive
3. When a new OTA update is created or published:
   - Backend pushes a notification to all connected clients
4. Client immediately fetches latest update config
5. OTA update can be applied without waiting for periodic checks

✅ This approach reduces battery usage and improves update responsiveness.

---

## 📦 Core Features

- 🌐 REST APIs for OTA update configuration
- 📡 WebSocket server for real-time update notifications
- 🔐 Environment-based configuration using `.env`
- 🧩 Designed to work with Android A/B OTA update flow
- 🧪 Easy to extend for auth, channels (alpha/beta/stable), or device targeting

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- WebSocket (`ws`)
- Environment-based configuration (`dotenv`)
- JSON-based OTA configuration model

---

## 🧪 Intended Environment

- Custom Android OS (AOSP-based)
- OEM / enterprise devices
- Rooted or system-level Android apps
- Devices supporting **A/B partitioning**

> ⚠️ This backend is not intended for public consumer apps or Play Store usage.

---

## 🔐 Environment Variables

Create a `config.env` file based on `config.env.example`:

```bash
cp config.env.example config.env

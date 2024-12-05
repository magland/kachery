# Kachery Infrastructure Maintenance Guide

This document outlines the key components and maintenance requirements for the Kachery infrastructure.

## Core Infrastructure Components

### 1. Database (MongoDB)
- **Purpose**: Stores user information, zone data, and a log of file uploads/downloads
- **Configuration**:
  - Host a database at mongodb.com
  - Set the `MONGO_URI` environment variable on the API (Vercel)
- **Maintenance Tasks**:
  - Regular database backups
  - Monitor database size and performance
  - Periodic cleanup of old logs
- **Cost**:
  - Right now ~$30/month.
  - The only significant load is the download/upload logs, which can be periodically cleaned up.

### 2. Cloud Storage
- **Supported Providers**:
  - AWS S3
  - Cloudflare R2
- **Configuration Requirements**:
  - For each zone, set the access credentials in the GUI: accessKeyId, secretAccessKey
  - Most zones are on the same central buckets
  - Zones for heavy users are on their own buckets
- **Maintenance Tasks**:
  - Monitor storage usage and costs
  - Implement lifecycle policies for scratch zone cleanup
  - Periodic backups (simplified because content-addressible)
- **Cost**
  - Depends on provider. I am using Cloudflare because egress is free. The current cost is ~$20/month.

### 3. API and GUI Infrastructure (Vercel)
- **Purpose**: Hosts the Kachery API and GUI
- **API Endpoints**:
  - User management endpoints
  - File upload/download handlers
  - Zone management
  - Usage statistics
- **Maintenance Tasks**:
  - Monitor API performance and response times
  - Monitor usage patterns
  - Set configuration environment variables (MONGO_URI, GH_CLIENT_ID, etc.)
- **Cost**:
  - Right now $20/month

## General tasks

* Monitor overall usage
* Monitor user accounts (github IDs and research descriptions) to ensure usage is legit
* Identify users with heavy load and migrate them to their own zones
* Identify users with especially heavy load and move their zones to their own buckets

## Zone Management

* **Scratch zone (scratch)** is useful for temporary storage, e.g., during development or for one-off visualizations. I think most users will get started with this. It does not require any login.
* **Default zone (default)** is useful for longer-term storage. It requires a login including specifying a GitHub ID and a description of research.
* **Custom zones** are for users with heavy load. They can be hosted on the central bucket along with the default/scratch zones (easiest), but for especially heavy users, they can be hosted on their own bucket.



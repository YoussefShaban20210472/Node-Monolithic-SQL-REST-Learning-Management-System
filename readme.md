# Learning Management System (LMS)

A production-style Learning Management System (LMS) REST API built with **Node.js**, **Express**, **PostgreSQL**, and **Redis**.

The project implements a complete educational platform where administrators, instructors, and students can manage courses, lessons, assessments, attendance, file submissions, notifications, and academic progress.

---

# Features

## Authentication & Authorization

* JWT-based authentication
* Secure password hashing using bcrypt
* Role-Based Access Control (RBAC)
* Login and logout endpoints
* Token revocation using Redis
* Automatic invalidation of existing tokens after logout
* Protection against using old tokens after account changes

### Supported Roles

* Admin
* Instructor
* Student

---

## User Management

Users can:

* Register accounts
* Log in
* View profile information
* Update profile information

Administrators can:

* Create users
* Manage user accounts
* Delete users
* Control access to the system

---

## Course Management

Instructors can:

* Create courses
* Update course information
* Delete courses
* Manage course content

Students can:

* Browse available courses
* Enroll in courses

Administrators and instructors can:

* View enrolled students
* Manage enrollments

---

## Lesson Management

Each course contains lessons.

Features include:

* Create lessons
* Update lessons
* Delete lessons
* Retrieve lesson information
* Attendance integration

---

## Attendance System

Attendance is implemented using One-Time Passwords (OTP).

Workflow:

1. Instructor generates an OTP for a lesson.
2. Student submits attendance request with OTP.
3. System validates the OTP.
4. Attendance record is stored.

This prevents unauthorized attendance submissions.

---

## Assessment System

### Question Bank

Each course maintains its own question bank.

Supported question types:

* Multiple Choice Questions (MCQ)
* True / False
* Short Answer Questions

### Quiz Management

Instructors can:

* Create quizzes
* Update quizzes
* Delete quizzes
* Select questions from the question bank

Features:

* Question validation
* Course ownership validation
* Time window validation
* Quiz attempt tracking

### Quiz Attempts

Students can:

* Submit quiz attempts
* Receive scores
* Review quiz results

---

## Assignment Management

Instructors can:

* Create assignments
* Manage assignment settings
* Review submissions

Students can:

* Upload assignment submissions
* Retrieve submitted files

---

## File Management

The platform supports course and assignment file uploads.

Supported functionality:

* Upload course materials
* Download course materials
* Delete uploaded files
* Assignment submission uploads
* Submission file retrieval

Uploaded files are synchronized with database records and cleaned up safely when operations fail.

---

## Notification System

The system includes an internal notification service.

Users can:

* View notifications
* Filter notifications
* Track unread notifications

Examples:

* Enrollment notifications
* Course updates
* Assessment-related notifications

---

# Architecture

The application follows a layered monolithic architecture:

```text
Client
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Models
   │
   ▼
PostgreSQL
```

Each layer has a single responsibility:

### Routes

Handle endpoint registration and middleware composition.

### Controllers

Receive HTTP requests and return HTTP responses.

### Services

Contain business logic, validation, authorization checks, and workflow orchestration.

### Models

Handle direct database interaction using PostgreSQL.

---

# Security Design

## JWT Authentication

Authenticated users receive a JWT containing:

* User ID
* User Role
* Token Version

## Redis-Based Token Revocation

JWTs are stateless and normally remain valid until expiration.

To support secure logout, the system stores a token version in Redis.

During authentication:

1. JWT is verified.
2. User token version is loaded from Redis.
3. Versions are compared.
4. Requests are rejected if versions do not match.

Benefits:

* Immediate logout
* Token invalidation without database writes
* Protection against reuse of old access tokens

---

# Validation

The project uses **Zod** for request validation.

Validation is applied to:

* Authentication requests
* Users
* Courses
* Lessons
* Attendance
* Quizzes
* Question banks
* Assignments
* Notifications
* File operations

This ensures invalid requests never reach business logic.

---

# Error Handling

Custom error handling is implemented for:

* Business logic errors
* Database errors
* Validation errors
* Redis errors
* Multer upload errors

A centralized error middleware provides consistent API responses.

---

# Middleware

The project contains dedicated middleware for:

* Authentication
* Role authorization
* Resource ownership validation
* Enrollment validation
* Entity existence validation
* Request validation
* Error handling

Examples include:

* Admin authorization
* Instructor authorization
* Student authorization
* Course ownership checks
* Submission ownership checks

---

# Technology Stack

## Backend

* Node.js
* Express 5

## Database

* PostgreSQL

## Cache & Session Management

* Redis

## Authentication

* JWT
* bcrypt

## Validation

* Zod

## File Uploads

* Multer

## Testing

* Jest
* Supertest

---

# Project Structure

```text
app/
├── cache/
├── controller/
├── database/
├── error/
├── jwt/
├── middleware/
├── model/
├── routes/
├── service/
├── validator/
└── utility/

storage/
└── uploads/

test/
```

---

# API Modules

The system exposes REST endpoints for:

* Authentication
* Users
* Courses
* Lessons
* Enrollments
* Attendance
* Question Banks
* Quizzes
* Quiz Attempts
* Assignments
* Assignment Files
* Submission Files
* Notifications

---

# Testing

The project includes automated testing using:

* Jest
* Supertest

Tests cover:

* API endpoints
* Authentication
* Authorization
* Validation
* Business rules
* Database interactions

---

# Learning Objectives

This project was built to gain practical experience with:

* REST API Design
* Software Architecture
* PostgreSQL Database Design
* Authentication & Authorization
* Redis Integration
* File Upload Handling
* Validation Strategies
* Testing Backend Applications
* Error Handling Patterns
* Building Large Monolithic Applications

---

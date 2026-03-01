# API Documentation

This document provides a comprehensive overview of the REST API endpoints available in the Campus Facility Booking System. 

## Base URL
All timestamps and dates are ISO 8601 formatted (`YYYY-MM-DD` and `HH:MM:SS`). All endpoints are relative to the server root (e.g. `http://localhost:8080`).

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Description**: Registers a new user account.
- **Request Body** (JSON):
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "password": "securepassword",
    "role": "STUDENT" // or "ADMIN", "STAFF"
  }
  ```
- **Responses**:
  - `201 Created`: User successfully registered. Returns message and user info.
  - `409 Conflict`: Username or Email already exists.

### 1.2 Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Description**: Authenticates a user and issues a JWT. The JWT is returned in the response body and also set as an `HttpOnly` secure cookie (`next-auth.session-token`).
- **Request Body** (JSON):
  ```json
  {
    "username": "janedoe",
    "password": "securepassword"
  }
  ```
- **Responses**:
  - `200 OK`: Login successful. Returns `token`, `message`, and `user` details.
  - `401 Unauthorized`: Invalid credentials.

### 1.3 Logout
- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Description**: Blacklists the current JWT and clears the `HttpOnly` session cookie.
- **Responses**:
  - `200 OK`: Logged out successfully.

### 1.4 Get Current User
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Description**: Returns the details of the currently authenticated user based on the provided JWT.
- **Headers/Cookies**: Requires `Authorization: Bearer <token>` OR the `next-auth.session-token` cookie.
- **Responses**:
  - `200 OK`: Returns user details (`username`, `role`, `email`).
  - `401 Unauthorized`: Missing, invalid, or expired token.

---

## 2. Availability Endpoints (`/api/availability`)

### 2.1 Check Specific Time availability
- **URL**: `/api/availability`
- **Method**: `GET`
- **Description**: Checks whether a specific time slot is available for a given facility.
- **Query Parameters**:
  - `facilityId` (Integer): ID of the facility.
  - `date` (String): ISO Date (`YYYY-MM-DD`).
  - `startTime` (String): ISO Time (`HH:MM:SS`).
  - `endTime` (String): ISO Time (`HH:MM:SS`).
- **Responses**:
  - `200 OK`: Returns an object with an `available` boolean.

### 2.2 Get Available Time Slots
- **URL**: `/api/availability/slots`
- **Method**: `GET`
- **Description**: Returns 30-minute time slots for the given facility and date within campus operating hours (06:00 – 19:00).
- **Query Parameters**:
  - `facilityId` (Integer): ID of the facility.
  - `date` (String): ISO Date (`YYYY-MM-DD`).
- **Responses**:
  - `200 OK`: Returns an array of slots (`start`, `end`, `booked`).

---

## 3. Booking Endpoints (`/api/bookings`)

### 3.1 Get All Bookings
- **URL**: `/api/bookings`
- **Method**: `GET`
- **Description**: Retrieves all bookings. If `studentId` is provided, it filters the bookings for that student.
- **Query Parameters**:
  - `studentId` (String, optional): The ID of the student.
- **Responses**:
  - `200 OK`: Array of `Booking` objects.

### 3.2 Get Single Booking
- **URL**: `/api/bookings/{id}`
- **Method**: `GET`
- **Description**: Retrieves a specific booking by its ID.
- **Path Parameters**:
  - `id` (Integer): Booking ID.
- **Responses**:
  - `200 OK`: The `Booking` object.

### 3.3 Create Booking
- **URL**: `/api/bookings`
- **Method**: `POST`
- **Description**: Creates a new facility booking.
- **Request Body** (JSON):
  ```json
  {
    "facilityId": 1,
    "studentId": "S12345",
    "date": "2023-10-15",
    "startTime": "09:00:00",
    "endTime": "10:30:00",
    "notes": "Project meeting",
    "status": "CONFIRMED"
  }
  ```
- **Responses**:
  - `201 Created`: The newly created `Booking` object.

### 3.4 Update Booking
- **URL**: `/api/bookings/{id}`
- **Method**: `PUT`
- **Description**: Updates an existing booking (e.g., date, time, status).
- **Path Parameters**:
  - `id` (Integer): Booking ID.
- **Request Body** (JSON): `BookingRequest` object (all fields required).
- **Responses**:
  - `200 OK`: The updated `Booking` object.

### 3.5 Cancel Booking
- **URL**: `/api/bookings/{id}/cancel`
- **Method**: `PATCH`
- **Description**: Soft-cancels a booking by changing its status to `CANCELLED` without deleting the record.
- **Path Parameters**:
  - `id` (Integer): Booking ID.
- **Responses**:
  - `200 OK`: The updated `Booking` object.

### 3.6 Delete Booking
- **URL**: `/api/bookings/{id}`
- **Method**: `DELETE`
- **Description**: Permanently deletes a booking record (Hard-delete).
- **Path Parameters**:
  - `id` (Integer): Booking ID.
- **Responses**:
  - `200 OK`: Success message.

---

## 4. Facility Endpoints (`/api/facilities`)

### 4.1 Get All Facilities
- **URL**: `/api/facilities`
- **Method**: `GET`
- **Description**: Retrieves all available facilities.
- **Responses**:
  - `200 OK`: Array of `Facility` objects.

### 4.2 Get Single Facility
- **URL**: `/api/facilities/{id}`
- **Method**: `GET`
- **Description**: Retrieves a specific facility by its ID.
- **Path Parameters**:
  - `id` (Integer): Facility ID.
- **Responses**:
  - `200 OK`: The `Facility` object.

### 4.3 Create Facility
- **URL**: `/api/facilities`
- **Method**: `POST`
- **Description**: Creates a new facility.
- **Request Body** (JSON):
  ```json
  {
    "name": "Main Hall",
    "location": "Building A",
    "capacity": 200,
    "type": "Auditorium"
  }
  ```
- **Responses**:
  - `201 Created`: The newly created `Facility` object.

### 4.4 Update Facility
- **URL**: `/api/facilities/{id}`
- **Method**: `PUT`
- **Description**: Updates an existing facility's details.
- **Path Parameters**:
  - `id` (Integer): Facility ID.
- **Request Body** (JSON): `FacilityRequest` object (all fields required).
- **Responses**:
  - `200 OK`: The updated `Facility` object.

### 4.5 Delete Facility
- **URL**: `/api/facilities/{id}`
- **Method**: `DELETE`
- **Description**: Permanently deletes a facility.
- **Path Parameters**:
  - `id` (Integer): Facility ID.
- **Responses**:
  - `204 No Content`: Successful deletion, no body returned.

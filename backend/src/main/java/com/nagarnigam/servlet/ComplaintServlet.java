package com.nagarnigam.servlet;

import com.nagarnigam.util.Auth;
import com.nagarnigam.util.Db;
import com.nagarnigam.util.Json;
import com.nagarnigam.util.SessionUser;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@WebServlet("/api/complaints/*")
@MultipartConfig
public class ComplaintServlet extends HttpServlet {

    private static String resolveUploadsDir() {
        String raw = Db.props().getProperty("uploads.dir", System.getProperty("java.io.tmpdir"));
        String catalinaBase = System.getProperty("catalina.base");
        if (catalinaBase != null) {
            raw = raw.replace("${catalina.base}", catalinaBase);
        }
        return raw;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        // POST /api/complaints (multipart/form-data)
        String contentType = req.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("multipart/")) {
            Json.write(resp, 400, Map.of("error", "EXPECTED_MULTIPART"));
            return;
        }

        String category = req.getParameter("category");
        String description = req.getParameter("description");
        String address = req.getParameter("address");
        String ward = req.getParameter("ward");
        String latStr = req.getParameter("latitude");
        String lngStr = req.getParameter("longitude");

        if (category == null || description == null) {
            Json.write(resp, 400, Map.of("error", "MISSING_FIELDS"));
            return;
        }

        Double latitude = null, longitude = null;
        try {
            if (latStr != null && !latStr.isBlank()) latitude = Double.parseDouble(latStr);
            if (lngStr != null && !lngStr.isBlank()) longitude = Double.parseDouble(lngStr);
        } catch (NumberFormatException ignored) {}

        SessionUser u = Auth.getUser(req);
        Long userId = (u == null) ? null : u.id;

        try (Connection con = Db.getConnection()) {
            con.setAutoCommit(false);

            long complaintId;
            try (PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO complaints(user_id, category, description, address, ward, latitude, longitude, status) VALUES (?,?,?,?,?,?,?,'PENDING')",
                    Statement.RETURN_GENERATED_KEYS)) {
                if (userId == null) ps.setNull(1, java.sql.Types.BIGINT);
                else ps.setLong(1, userId);
                ps.setString(2, category);
                ps.setString(3, description);
                ps.setString(4, address);
                ps.setString(5, ward);
                if (latitude == null) ps.setNull(6, java.sql.Types.DECIMAL);
                else ps.setDouble(6, latitude);
                if (longitude == null) ps.setNull(7, java.sql.Types.DECIMAL);
                else ps.setDouble(7, longitude);
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    complaintId = keys.getLong(1);
                }
            }

            String trackingCode = String.format("NN-%d-%06d", Year.now().getValue(), complaintId);
            try (PreparedStatement ps = con.prepareStatement("UPDATE complaints SET tracking_code=? WHERE id=?")) {
                ps.setString(1, trackingCode);
                ps.setLong(2, complaintId);
                ps.executeUpdate();
            }

            // Initial update
            try (PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO complaint_updates(complaint_id,status,comment,updated_by) VALUES (?,?,?,?)")) {
                ps.setLong(1, complaintId);
                ps.setString(2, "PENDING");
                ps.setString(3, "Complaint registered");
                if (userId == null) ps.setNull(4, java.sql.Types.BIGINT);
                else ps.setLong(4, userId);
                ps.executeUpdate();
            }

            // Save attachments
            String uploadsDir = resolveUploadsDir();
            Path complaintDir = Path.of(uploadsDir, "complaint-" + complaintId);
            Files.createDirectories(complaintDir);

            for (Part part : req.getParts()) {
                if (!"files".equals(part.getName())) continue;
                if (part.getSize() <= 0) continue;

                String submitted = part.getSubmittedFileName();
                String originalName = (submitted == null) ? "file" : Path.of(submitted).getFileName().toString();
                String ext = "";
                int idx = originalName.lastIndexOf('.');
                if (idx > 0 && idx < originalName.length() - 1) ext = originalName.substring(idx);

                String storedName = UUID.randomUUID() + ext;
                Path storedPath = complaintDir.resolve(storedName);
                part.write(storedPath.toString());

                try (PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO attachments(complaint_id,file_name,stored_path,mime_type) VALUES (?,?,?,?)")) {
                    ps.setLong(1, complaintId);
                    ps.setString(2, originalName);
                    ps.setString(3, storedPath.toString());
                    ps.setString(4, part.getContentType());
                    ps.executeUpdate();
                }
            }

            con.commit();
            Json.write(resp, 201, Map.of("ok", true, "trackingCode", trackingCode));
        } catch (Exception e) {
            Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        // GET /api/complaints/track/{trackingCode}
        // As per requirement: tracking requires login
        SessionUser current = Auth.getUser(req);
        if (current == null) {
            Json.write(resp, 401, Map.of("error", "NOT_LOGGED_IN"));
            return;
        }

        String path = req.getPathInfo();
        if (path == null || !path.startsWith("/track/")) {
            Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
            return;
        }
        String trackingCode = path.substring("/track/".length());
        if (trackingCode.isBlank()) {
            Json.write(resp, 400, Map.of("error", "MISSING_TRACKING_CODE"));
            return;
        }

        try (Connection con = Db.getConnection()) {
            Long complaintId = null;
            Map<String, Object> complaint = null;
            Long ownerUserId = null;
            boolean ownerIsNull = false;

            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT id, user_id, tracking_code, category, description, address, ward, latitude, longitude, status, created_at FROM complaints WHERE tracking_code=?")) {
                ps.setString(1, trackingCode);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
                        return;
                    }
                    complaintId = rs.getLong("id");
                    long tmpOwner = rs.getLong("user_id");
                    ownerIsNull = rs.wasNull();
                    ownerUserId = ownerIsNull ? null : tmpOwner;

                    // Authorization:
                    // - ADMIN can track any complaint
                    // - USER can track only their own complaints
                    // - if complaint has no owner (guest complaint), allow any logged-in user to track
                    if (!"ADMIN".equalsIgnoreCase(current.role)) {
                        if (!ownerIsNull && ownerUserId != null && ownerUserId != current.id) {
                            Json.write(resp, 403, Map.of("error", "FORBIDDEN"));
                            return;
                        }
                    }
                    complaint = Map.of(
                            "trackingCode", rs.getString("tracking_code"),
                            "category", rs.getString("category"),
                            "description", rs.getString("description"),
                            "address", rs.getString("address"),
                            "ward", rs.getString("ward"),
                            "latitude", rs.getObject("latitude"),
                            "longitude", rs.getObject("longitude"),
                            "status", rs.getString("status"),
                            "createdAt", rs.getTimestamp("created_at").toInstant().toString()
                    );
                }
            }

            List<Map<String, Object>> updates = new ArrayList<>();
            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT status, comment, updated_at FROM complaint_updates WHERE complaint_id=? ORDER BY updated_at ASC")) {
                ps.setLong(1, complaintId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        updates.add(Map.of(
                                "status", rs.getString("status"),
                                "comment", rs.getString("comment"),
                                "updatedAt", rs.getTimestamp("updated_at").toInstant().toString()
                        ));
                    }
                }
            }

            List<Map<String, Object>> attachments = new ArrayList<>();
            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT file_name, mime_type, uploaded_at FROM attachments WHERE complaint_id=? ORDER BY uploaded_at ASC")) {
                ps.setLong(1, complaintId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        attachments.add(Map.of(
                                "fileName", rs.getString("file_name"),
                                "mimeType", rs.getString("mime_type"),
                                "uploadedAt", rs.getTimestamp("uploaded_at").toInstant().toString()
                        ));
                    }
                }
            }

            Json.write(resp, 200, Map.of("complaint", complaint, "updates", updates, "attachments", attachments));
        } catch (Exception e) {
            Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }
}

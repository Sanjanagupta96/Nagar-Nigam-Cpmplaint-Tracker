package com.nagarnigam.servlet;

import com.nagarnigam.util.Auth;
import com.nagarnigam.util.Db;
import com.nagarnigam.util.Json;
import com.nagarnigam.util.SessionUser;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@WebServlet("/api/admin/complaints/*")
public class AdminComplaintServlet extends HttpServlet {
    static class UpdateStatusBody {
        public String status;
        public String comment;
    }

    private boolean requireAdmin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!Auth.isAdmin(req)) {
            Json.write(resp, 403, Map.of("error", "ADMIN_REQUIRED"));
            return false;
        }
        return true;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireAdmin(req, resp)) return;

        // GET /api/admin/complaints?status=PENDING
        String status = req.getParameter("status");
        if (status == null || status.isBlank()) status = "PENDING";

        try (Connection con = Db.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "SELECT c.tracking_code, c.category, c.status, c.created_at, u.full_name, u.email, u.phone " +
                             "FROM complaints c " +
                             "LEFT JOIN users u ON c.user_id = u.id " +
                             "WHERE c.status=? ORDER BY c.created_at DESC")) {
            ps.setString(1, status);
            List<Map<String, Object>> items = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String fullName = rs.getString("full_name");
                    String email = rs.getString("email");
                    String phone = rs.getString("phone");
                    items.add(Map.of(
                            "trackingCode", rs.getString("tracking_code"),
                            "category", rs.getString("category"),
                            "status", rs.getString("status"),
                            "createdAt", rs.getTimestamp("created_at").toInstant().toString(),
                            "user", Map.of(
                                    "fullName", fullName == null ? "" : fullName,
                                    "email", email == null ? "" : email,
                                    "phone", phone == null ? "" : phone
                            )
                    ));
                }
            }
            Json.write(resp, 200, Map.of("items", items));
        } catch (Exception e) {
            Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireAdmin(req, resp)) return;

        // PUT /api/admin/complaints/{trackingCode}/status
        String path = req.getPathInfo();
        if (path == null) path = "";
        String[] parts = path.split("/");
        if (parts.length != 3 || parts[1].isBlank() || !"status".equals(parts[2])) {
            Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
            return;
        }
        String trackingCode = parts[1];

        UpdateStatusBody body = Json.read(req, UpdateStatusBody.class);
        if (body.status == null || body.status.isBlank()) {
            Json.write(resp, 400, Map.of("error", "MISSING_STATUS"));
            return;
        }

        SessionUser admin = Auth.getUser(req);

        try (Connection con = Db.getConnection()) {
            con.setAutoCommit(false);
            Long complaintId = null;

            try (PreparedStatement ps = con.prepareStatement("SELECT id FROM complaints WHERE tracking_code=?")) {
                ps.setString(1, trackingCode);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
                        return;
                    }
                    complaintId = rs.getLong("id");
                }
            }

            try (PreparedStatement ps = con.prepareStatement("UPDATE complaints SET status=? WHERE id=?")) {
                ps.setString(1, body.status);
                ps.setLong(2, complaintId);
                ps.executeUpdate();
            }

            try (PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO complaint_updates(complaint_id,status,comment,updated_by) VALUES (?,?,?,?)")) {
                ps.setLong(1, complaintId);
                ps.setString(2, body.status);
                ps.setString(3, body.comment);
                ps.setLong(4, admin.id);
                ps.executeUpdate();
            }

            con.commit();
            Json.write(resp, 200, Map.of("ok", true));
        } catch (Exception e) {
            Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }
}

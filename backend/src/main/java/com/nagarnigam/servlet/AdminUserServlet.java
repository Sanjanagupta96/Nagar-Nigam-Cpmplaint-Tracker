package com.nagarnigam.servlet;

import com.nagarnigam.util.Auth;
import com.nagarnigam.util.Db;
import com.nagarnigam.util.Json;
import org.mindrot.jbcrypt.BCrypt;

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

/**
 * Admin-only user management.
 * Requirement: Admin register nahi hoga. Existing admin login karega, then aur admin add karega.
 */
@WebServlet("/api/admin/users/*")
public class AdminUserServlet extends HttpServlet {
    static class CreateAdminBody {
        public String fullName;
        public String email;
        public String password;
    }

    private boolean requireAdmin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!Auth.isAdmin(req)) {
            Json.write(resp, 403, Map.of("error", "ADMIN_REQUIRED"));
            return false;
        }
        return true;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireAdmin(req, resp)) return;

        // POST /api/admin/users/admins  (create new admin)
        String path = req.getPathInfo();
        if (path == null) path = "";
        if (!"/admins".equals(path)) {
            Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
            return;
        }

        CreateAdminBody body = Json.read(req, CreateAdminBody.class);
        if (body == null || body.fullName == null || body.email == null || body.password == null
                || body.fullName.isBlank() || body.email.isBlank() || body.password.isBlank()) {
            Json.write(resp, 400, Map.of("error", "MISSING_FIELDS"));
            return;
        }

        String hash = BCrypt.hashpw(body.password, BCrypt.gensalt(10));

        try (Connection con = Db.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "INSERT INTO users(full_name,email,phone,password_hash,role) VALUES (?,?,NULL,?, 'ADMIN')")) {
            ps.setString(1, body.fullName.trim());
            ps.setString(2, body.email.trim());
            ps.setString(3, hash);
            ps.executeUpdate();
            Json.write(resp, 201, Map.of("ok", true));
        } catch (Exception e) {
            Json.write(resp, 400, Map.of("error", "CREATE_ADMIN_FAILED", "message", e.getMessage()));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!requireAdmin(req, resp)) return;

        // GET /api/admin/users  -> list registered users (citizens)
        String path = req.getPathInfo();
        if (path == null) path = "";
        if (!"".equals(path) && !"/".equals(path)) {
            Json.write(resp, 404, Map.of("error", "NOT_FOUND"));
            return;
        }

        try (Connection con = Db.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC")) {
            List<Map<String, Object>> items = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    items.add(Map.of(
                            "id", rs.getLong("id"),
                            "fullName", rs.getString("full_name"),
                            "email", rs.getString("email") == null ? "" : rs.getString("email"),
                            "phone", rs.getString("phone") == null ? "" : rs.getString("phone"),
                            "role", rs.getString("role"),
                            "createdAt", rs.getTimestamp("created_at").toInstant().toString()
                    ));
                }
            }
            Json.write(resp, 200, Map.of("items", items));
        } catch (Exception e) {
            Json.write(resp, 500, Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }
}

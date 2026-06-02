package com.nagarnigam.util;

import java.io.Serializable;

public class SessionUser implements Serializable {
    public long id;
    public String fullName;
    public String role; // USER / ADMIN

    public SessionUser() {}

    public SessionUser(long id, String fullName, String role) {
        this.id = id;
        this.fullName = fullName;
        this.role = role;
    }
}


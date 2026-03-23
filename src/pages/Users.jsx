import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { usersApi } from "../services/api";

const ROLES = ["Admin", "Lecturer", "Student"];
const STUDENT_ROLE = "Student";

const initialUserForm = {
  name: "",
  email: "",
  password: "",
  role: "Student"
};

export default function Users() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialUserForm);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = user?.role === "Admin";
  const isLecturer = user?.role === "Lecturer";
  const effectiveRoleFilter = isLecturer ? STUDENT_ROLE : roleFilter;

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const data = await usersApi.list(
          token,
          effectiveRoleFilter ? { role: effectiveRoleFilter } : undefined
        );
        if (!cancelled) {
          setUsers(data.users || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load users");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [token, effectiveRoleFilter]);

  async function handleCreateUser(event) {
    event.preventDefault();

    setCreating(true);
    setError("");

    try {
      const payload = isLecturer ? { ...form, role: STUDENT_ROLE } : form;
      const data = await usersApi.create(token, payload);
      setUsers((prev) => [data.user, ...prev]);
      setForm(initialUserForm);
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleUpdate(userId, role) {
    if (!isAdmin) {
      return;
    }

    setError("");

    try {
      const data = await usersApi.update(token, userId, { role });
      setUsers((prev) => prev.map((entry) => (entry._id === userId ? data.user : entry)));
    } catch (err) {
      setError(err.message || "Failed to update role");
    }
  }

  async function handleDeleteUser(userId) {
    if (!isAdmin) {
      return;
    }

    if (!window.confirm("Delete this user?")) {
      return;
    }

    setError("");

    try {
      await usersApi.remove(token, userId);
      setUsers((prev) => prev.filter((entry) => entry._id !== userId));
    } catch (err) {
      setError(err.message || "Failed to delete user");
    }
  }

  return (
    <section>
      <div className="page-head">
        <h2>{isLecturer ? "Student Management" : "User Management"}</h2>
        <p>
          {isLecturer
            ? "Create student accounts for your classes."
            : "Create and control user access across the workspace."}
        </p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <form className="panel form-grid" onSubmit={handleCreateUser}>
        <h3>{isLecturer ? "Create Student" : "Create User"}</h3>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />

        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />

        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
          minLength={6}
        />

        {isAdmin ? (
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        ) : (
          <input value={STUDENT_ROLE} disabled />
        )}

        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? "Creating..." : isLecturer ? "Add Student" : "Create User"}
        </button>
      </form>

      <div className="panel">
        <div className="section-head">
          <h3>{isLecturer ? "Students" : "Users"}</h3>
          {isAdmin ? (
            <select
              className="select select-inline"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="">All Roles</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {loading ? (
          <p className="empty-state">Loading users...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  {isAdmin ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.name}</td>
                    <td>{entry.email}</td>
                    <td>
                      {isAdmin ? (
                        <select
                          className="select select-inline"
                          value={entry.role}
                          onChange={(event) => handleRoleUpdate(entry._id, event.target.value)}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        entry.role
                      )}
                    </td>
                    {isAdmin ? (
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDeleteUser(entry._id)}
                          disabled={entry._id === user?._id}
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import {
  blockUser,
  getUsers,
  updateUserRole,
  type UserRole,
} from "../../api/admin";
import { isAdmin } from "../../api/token";

type AdminUser = {
  id: string | number;
  email: string;
  role: UserRole;
  isBlocked?: boolean;
  is_blocked?: boolean;
};

const visibleAdminUserEmails = new Set([
  "anna@test.com",
  "anna.kiliarova@nure.ua",
  "admin@test.com",
]);

const getItems = <T,>(data: T[] | { items?: T[]; users?: T[] }) => {
  return Array.isArray(data) ? data : data.items ?? data.users ?? [];
};

function AdminUsers() {
  const { t } = useTranslation();
  const canAccessAdmin = isAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(
        getItems<AdminUser>(data).filter((user) =>
          visibleAdminUserEmails.has(user.email.toLowerCase()),
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (canAccessAdmin) {
      loadUsers();
    }
  }, [canAccessAdmin]);

  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = async (userId: string | number, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      await loadUsers();
    } catch (error) {
      console.log(error);
    }
  };

  const handleBlockUser = async (user: AdminUser) => {
    try {
      await blockUser(user.id, !(user.isBlocked ?? user.is_blocked ?? false));
      await loadUsers();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("adminUsers")}</h1>
        <p>{t("adminSubtitle")}</p>
      </header>

      {users.length === 0 ? (
        <div className="empty-state">{t("noUsers")}</div>
      ) : (
        <section className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("id")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th>{t("status")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={
                        user.role === "admin"
                          ? "badge badge-primary"
                          : "badge badge-muted"
                      }
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const isBlocked = user.isBlocked ?? user.is_blocked ?? false;
                      return (
                    <span
                      className={
                        isBlocked
                          ? "badge badge-danger"
                          : "badge badge-success"
                      }
                    >
                      {isBlocked ? t("blocked") : t("active")}
                    </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="grid">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          handleRoleChange(
                            user.id,
                            event.target.value as UserRole,
                          )
                        }
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => handleBlockUser(user)}
                      >
                        {(user.isBlocked ?? user.is_blocked ?? false)
                          ? t("unblockUser")
                          : t("blockUser")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default AdminUsers;

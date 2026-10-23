
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";


const API = "http://localhost:5001/api";

export default function AdminDashboard({ onLogout }) {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [claims, setClaims] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
const [categoryDescription, setCategoryDescription] = useState("");
const [categoryMessage, setCategoryMessage] = useState("");
const [budgetCategoryId, setBudgetCategoryId] = useState("1");
const [budgetYear, setBudgetYear] = useState("2026");
const [annualLimit, setAnnualLimit] = useState("");
const [budgetMessage, setBudgetMessage] = useState("");
const [selectedClaim, setSelectedClaim] = useState(null);
const [comments, setComments] = useState([]);
const [newComment,setNewComment] = useState("");

const [employees, setEmployees] = useState([]);
const [employeeSearch, setEmployeeSearch] = useState("");
const [employeeMessage, setEmployeeMessage] = useState("");
const [employeeLoading, setEmployeeLoading] = useState(false);

const [employeeFormOpen, setEmployeeFormOpen] = useState(false);


const [claimStatusFilter, setClaimStatusFilter] = useState("ALL");
const [claimDepartmentFilter, setClaimDepartmentFilter] = useState("ALL");
const [claimCategoryFilter, setClaimCategoryFilter] = useState("ALL");


const filteredClaims = claims.filter((claim) => {
    const matchesStatus =
      claimStatusFilter === "ALL" ||
      claim.status === claimStatusFilter;
  
    const matchesDepartment =
      claimDepartmentFilter === "ALL" ||
      claim.department === claimDepartmentFilter;
  
    const matchesCategory =
      claimCategoryFilter === "ALL" ||
      String(claim.category_id) === claimCategoryFilter;
  
    return matchesStatus && matchesDepartment && matchesCategory;
  });
  
  

const [employeeForm, setEmployeeForm] = useState({
  full_name: "",
  email: "",
  password: "",
  department: "",
  phone: "",
});


const [editingEmployeeId, setEditingEmployeeId] = useState(null);


const fetchBudgets = async () => {
    try {
      const response = await fetch(`${API}/budgets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch budgets");
      }
  
      setBudgets(data.budgets);
    } catch (error) {
      setBudgetMessage(error.message);
    }
  };


const fetchCategories = async () => {
    try {
      const response = await fetch(`${API}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch categories");
      }
  
      setCategories(
        data.categories.map((category) => ({
          ...category,
          id: category._id || category.id,
        }))
      );
    } catch (error) {
      setBudgetMessage(error.message);
    }
  };
  
  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setCategoryMessage("");
  
    try {
      const response = await fetch(`${API}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to create category");
      }
  
      setCategoryMessage(data.message || "Category created successfully!");
      setCategoryName("");
      setCategoryDescription("");
      await fetchCategories();
    } catch (error) {
      setCategoryMessage(error.message || "Unable to create category");
    }
  };

  const handleSaveBudget = async (event) => {
    event.preventDefault();
    console.log("Category ID:", budgetCategoryId);
console.log("Budget year:", budgetYear);
console.log("Annual limit:", annualLimit);
    setBudgetMessage("");
  
    try {
      const response = await fetch(`${API}/budgets`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: budgetCategoryId,
          budget_year: Number(budgetYear),
          annual_limit: Number(annualLimit),
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to save budget");
      }
  
      setBudgetMessage(data.message);
      setAnnualLimit("");
      await fetchBudgets();
    } catch (error) {
      setBudgetMessage(error.message);
    }
  };

  const fetchClaims = async () => {
    try {
      const response = await fetch(`${API}/claims/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch claims");
      }

      setClaims(data.claims);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (token) {
    fetchClaims();
    fetchBudgets();
    fetchCategories();
  }
}, [token]);

  const handleReview = async (claimId, action) => {
    let reason = "";

    if (action === "reject") {
      reason = window.prompt("Enter the rejection reason:");

      if (reason === null) return;

      if (!reason.trim()) {
        setMessage("A rejection reason is required.");
        return;
      }
    }

    try {
      setProcessingId(claimId);
      setMessage("");

      const response = await fetch(
        `${API}/claims/${claimId}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          ...(action === "reject"
            ? { body: JSON.stringify({ reason }) }
            : {}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to review claim");
      }

      setMessage(data.message);
      await fetchClaims();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    onLogout();
  };


const fetchComments = async (claimId) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/comments/${claimId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch comments");
      }
  
      setComments(data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert(error.message || "Unable to load comments.");
    }
  };
  
  const handleAddComment = async (e) => {
    e.preventDefault();
  
    if (!newComment.trim() || !selectedClaim) {
      alert("Please enter a comment.");
      return;
    }
  
    try {
      const response = await fetch(
        `http://localhost:5001/api/comments/${selectedClaim.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment: newComment }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to add comment");
      }
  
      setNewComment("");
      await fetchComments(selectedClaim.id);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(error.message || "Unable to add comment.");
    }
  };


const fetchEmployees = async (search = employeeSearch) => {
    setEmployeeLoading(true);
    setEmployeeMessage("");
  
    try {
      const response = await fetch(
        `${API}/users?search=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch employees");
      }
  
      setEmployees(data.employees);
    } catch (error) {
      setEmployeeMessage(error.message || "Unable to load employees");
    } finally {
      setEmployeeLoading(false);
    }
  };

  
useEffect(() => {
    if (token) {
      fetchEmployees("");
    }
  }, [token]);
  
  

  const pendingCount = claims.filter(
    (claim) => claim.status === "PENDING"
  ).length;

  const approvedCount = claims.filter(
    (claim) => claim.status === "APPROVED"
  ).length;

  const rejectedCount = claims.filter(
    (claim) => claim.status === "REJECTED"
  ).length;

  if (loading) return <p>Loading claims...</p>;

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Welcome, {user?.full_name || "Admin"}
          </p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      {message && <p role="status">{message}</p>}

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          margin: "24px 0",
        }}
      >
        <div>Pending: <strong>{pendingCount}</strong></div>
        <div>Approved: <strong>{approvedCount}</strong></div>
        <div>Rejected: <strong>{rejectedCount}</strong></div>
      </div>

      <h2>Create Category</h2>

<form
  onSubmit={handleCreateCategory}
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "400px",
    marginBottom: "24px",
  }}
>
  <input
    type="text"
    placeholder="Category name"
    value={categoryName}
    onChange={(e) => setCategoryName(e.target.value)}
    required
  />

  <textarea
    placeholder="Category description"
    value={categoryDescription}
    onChange={(e) => setCategoryDescription(e.target.value)}
    rows={3}
  />

  <button type="submit">Create Category</button>

  {categoryMessage && <p role="status">{categoryMessage}</p>}
</form>


      <h2>Annual Budget Management</h2>

<form
  onSubmit={handleSaveBudget}
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px",
  }}
>
 

<select
  value={budgetCategoryId}
  onChange={(e) => setBudgetCategoryId(e.target.value)}
>
{categories.map((category) => (
  <option
    key={category._id || category.id}
    value={category._id || category.id}
  >
    {category.name}
  </option>
))}
</select>


  <input
    type="number"
    min="2000"
    max="2100"
    required
    value={budgetYear}
    onChange={(e) => setBudgetYear(e.target.value)}
  />

  <input
    type="number"
    placeholder="Annual limit (₹)"
    min="0.01"
    step="0.01"
    required
    value={annualLimit}
    onChange={(e) => setAnnualLimit(e.target.value)}
  />

  <button type="submit">Save Budget</button>
</form>

{budgetMessage && <p role="status">{budgetMessage}</p>}

<div style={{ overflowX: "auto", marginBottom: "32px" }}>
  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
      <th>Budget Type</th>
        <th>Category</th>
        <th>Year</th>
        <th>Annual Limit</th>
        <th>Approved</th>
        <th>Remaining</th>
      </tr>
    </thead>

    <tbody>
      {budgets.map((budget) => (
        <tr key={budget.id}>
          <td>Per Employee</td>
          <td>{budget.category_name}</td>
          <td>{budget.budget_year}</td>
          <td>
  ₹{Number(budget.annual_limit ?? 0).toLocaleString("en-IN")}
</td>
<td>
  ₹{Number(budget.total_approved_amount ?? 0).toLocaleString("en-IN")}
</td>
<td>
  ₹{Math.max(
    0,
    Number(budget.annual_limit ?? 0) -
      Number(budget.total_approved_amount ?? 0)
  ).toLocaleString("en-IN")}
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      <h2>All Expense Claims</h2>


<div style={{ marginBottom: "16px" }}>
  <label>
    Filter by Status:{" "}
    <select
      value={claimStatusFilter}
      onChange={(e) => setClaimStatusFilter(e.target.value)}
    >
      <option value="ALL">All Statuses</option>
      <option value="PENDING">Pending</option>
      <option value="APPROVED">Approved</option>
      <option value="REJECTED">Rejected</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  </label>
</div>


<div style={{ marginBottom: "16px" }}>
  <label>
    Filter by Department:{" "}
    <select
      value={claimDepartmentFilter}
      onChange={(e) => setClaimDepartmentFilter(e.target.value)}
    >
      <option value="ALL">All Departments</option>

      {[...new Set(
        claims
          .map((claim) => claim.department)
          .filter(Boolean)
      )].map((department) => (
        <option key={department} value={department}>
          {department}
        </option>
      ))}
    </select>
  </label>
</div>


<div style={{ marginBottom: "16px" }}>
  <label>
    Filter by Category:{" "}
    <select
      value={claimCategoryFilter}
      onChange={(e) => setClaimCategoryFilter(e.target.value)}
    >
      <option value="ALL">All Categories</option>

      {[...new Map(
        claims.map((claim) => [
          String(claim.category_id),
          claim.category_name,
        ])
      )].map(([categoryId, categoryName]) => (
        <option key={categoryId} value={categoryId}>
          {categoryName}
        </option>
      ))}
    </select>
  </label>
</div>



      <button onClick={fetchClaims}>Refresh Claims</button>

      {claims.length === 0 ? (
        <p>No claims found.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                {[
                  "ID",
                  "Employee",
                  "Department",
                  "Category",
                  "Amount",
                  "Expense Date",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #ccc",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
            {filteredClaims.map((claim) => (
                <tr key={claim.id}>
                  <td style={{ padding: "12px" }}>{claim.id}</td>
                  <td style={{ padding: "12px" }}>
                    {claim.employee_name}
                    <br />
                    <small>{claim.employee_email}</small>
                  </td>
                  <td style={{ padding: "12px" }}>
                    {claim.department || "—"}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {claim.category_name}
                  </td>
                  <td style={{ padding: "12px" }}>
                    ₹{Number(claim.total_amount).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "12px" }}>
                    {String(claim.expense_date).slice(0, 10)}
                  </td>
                  <td style={{ padding: "12px" }}>{claim.status}</td>

<td style={{ padding: "12px" }}>
  <button
    onClick={() => {
      setSelectedClaim(claim);
      setComments([]);
      setNewComment("");
      fetchComments(claim.id);
    }}
  >
    View Comments
  </button>
</td>

                  <td style={{ padding: "12px" }}>
                    {claim.status === "PENDING" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleReview(claim.id, "approve")}
                        >
                          Approve
                        </button>

                        <button
                          disabled={processingId !== null}
                          onClick={() => handleReview(claim.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

{selectedClaim && (
  <div>
    <h3>Comments — Claim #{selectedClaim.id}</h3>

    {comments.length === 0 ? (
      <p>No comments yet.</p>
    ) : (
      comments.map((comment) => (
        <div key={comment.id}>
          <p>
            <strong>{comment.full_name || "User"}:</strong>{" "}
            {comment.message}
          </p>
          <small>
            {new Date(comment.created_at).toLocaleString()}
          </small>
        </div>
      ))
    )}

    <form onSubmit={handleAddComment}>
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
      />
      <button type="submit">Submit Comment</button>
    </form>

    <button
      onClick={() => {
        setSelectedClaim(null);
        setComments([]);
        setNewComment("");
      }}
    >
      Close Comments
    </button>
  </div>
)}

</div>
    )}

    {/* Employee Management */}
    <hr style={{ margin: "30px 0" }} />

    <h2>Employee Management</h2>


<button
  onClick={() => {
    setEmployeeForm({
      full_name: "",
      email: "",
      password: "",
      department: "",
      phone: "",
    });

    setEditingEmployeeId(null);
    setEmployeeFormOpen(true);
    setEmployeeMessage("");
  }}
>
  Add Employee
</button>



{(editingEmployeeId !== null || employeeFormOpen) && (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      setEmployeeMessage("");

      try {
        
const isEditing = editingEmployeeId !== null;

const response = await fetch(
  isEditing
    ? `${API}/users/${editingEmployeeId}`
    : `${API}/users`,
  {
    method: isEditing ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      full_name: employeeForm.full_name,
      email: employeeForm.email,
      ...(isEditing ? {} : { password: employeeForm.password }),
      department: employeeForm.department,
      phone: employeeForm.phone,
    }),
  }
);


        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to update employee");
        }

        setEditingEmployeeId(null);
        setEmployeeFormOpen(false);
        setEmployeeForm({
          full_name: "",
          email: "",
          password: "",
          department: "",
          phone: "",
        });

        setEmployeeMessage("Employee updated successfully.");
        await fetchEmployees();
      } catch (error) {
        setEmployeeMessage(error.message);
      }
    }}
    style={{
      display: "grid",
      gap: "10px",
      maxWidth: "400px",
      marginBottom: "20px",
    }}
  >
<h3>{editingEmployeeId !== null ? "Edit Employee" : "Add Employee"}</h3>


{editingEmployeeId === null && (
  <input
    type="password"
    required
    minLength={8}
    value={employeeForm.password}
    onChange={(e) =>
      setEmployeeForm({
        ...employeeForm,
        password: e.target.value,
      })
    }
    placeholder="Temporary password (minimum 8 characters)"
  />
)}


    <input
      required
      value={employeeForm.full_name}
      onChange={(e) =>
        setEmployeeForm({ ...employeeForm, full_name: e.target.value })
      }
      placeholder="Full name"
    />

    <input
      required
      type="email"
      value={employeeForm.email}
      onChange={(e) =>
        setEmployeeForm({ ...employeeForm, email: e.target.value })
      }
      placeholder="Email"
    />

    <input
      value={employeeForm.department}
      onChange={(e) =>
        setEmployeeForm({ ...employeeForm, department: e.target.value })
      }
      placeholder="Department"
    />

    <input
      value={employeeForm.phone}
      onChange={(e) =>
        setEmployeeForm({ ...employeeForm, phone: e.target.value })
      }
      placeholder="Phone"
    />

    <div style={{ display: "flex", gap: "8px" }}>
      <button type="submit">Save Changes</button>

      <button
        type="button"
        onClick={() => {
          setEditingEmployeeId(null);
          setEmployeeFormOpen(false);
          setEmployeeMessage("");
        }}
      >
        Cancel
      </button>
    </div>
  </form>
)}


    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      <input
        type="text"
        value={employeeSearch}
        onChange={(e) => setEmployeeSearch(e.target.value)}
        placeholder="Search by name, email, or department"
      />

      <button onClick={() => fetchEmployees()}>
        Search
      </button>

      <button
        onClick={() => {
          setEmployeeSearch("");
          fetchEmployees("");
        }}
      >
        Clear
      </button>
    </div>

    {employeeMessage && <p>{employeeMessage}</p>}

    {employeeLoading ? (
      <p>Loading employees...</p>
    ) : (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Email</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Department</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Status</th>
            <th style={{ padding: "10px", textAlign: "left" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td style={{ padding: "10px" }}>{employee.full_name}</td>
              <td style={{ padding: "10px" }}>{employee.email}</td>
              <td style={{ padding: "10px" }}>
                {employee.department || "—"}
              </td>
              <td style={{ padding: "10px" }}>
                {employee.is_active ? "Active" : "Inactive"}
              </td>
              <td style={{ padding: "10px" }}>
                <button
                  
onClick={() => {
    setEmployeeForm({
      full_name: employee.full_name || "",
      email: employee.email || "",
      password: "",
      department: employee.department || "",
      phone: employee.phone || "",
    });
  
    setEditingEmployeeId(employee.id);
    setEmployeeMessage(`Editing ${employee.full_name}`);
  }}
  
                >
                  Edit
                </button>

                <button
                  disabled={!employee.is_active}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        `Deactivate ${employee.full_name}?`
                      )
                    ) {
                      return;
                    }

                    try {
                      const response = await fetch(
                        `${API}/users/${employee.id}/deactivate`,
                        {
                          method: "PATCH",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Failed to deactivate employee"
                        );
                      }

                      await fetchEmployees();
                      setEmployeeMessage("Employee deactivated successfully.");
                    } catch (error) {
                      setEmployeeMessage(error.message);
                    }
                  }}
                >
                  Deactivate
                </button>
              </td>
            </tr>
          ))}

          {employees.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: "10px" }}>
                No employees found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )}
  </div>
);
}

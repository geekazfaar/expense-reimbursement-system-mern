import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import CreateClaim from "./CreateClaim";
import { useEffect, useState } from "react";


function Dashboard({ onLogout })  {
    const user = useSelector((state) => state.auth.user);
    const token = useSelector((state) => state.auth.token);
    const dispatch = useDispatch();
    const handleCancelClaim = async (claimId) => {
        const confirmed = window.confirm(
          "Are you sure you want to cancel this expense claim?"
        );
      
        if (!confirmed) return;
      
        try {
          const response = await fetch(
            `http://localhost:5001/api/claims/${claimId}/cancel`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
      
          const data = await response.json();
      
          if (!response.ok) {
            throw new Error(data.message || "Failed to cancel claim");
          }
      
          setClaims((previousClaims) =>
            previousClaims.map((claim) =>
              claim.id === claimId ? data.claim : claim
            )
          );
        } catch (error) {
          window.alert(error.message || "Unable to cancel claim");
        }
      };
      const handleAddComment = async (e) => {
        e.preventDefault();
      
        if (!newComment.trim()) {
          window.alert("Please enter a comment.");
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
              body: JSON.stringify({
                comment: newComment,
              }),
            }
          );
      
          const data = await response.json();
      
          if (!response.ok) {
            throw new Error(data.message || "Failed to add comment");
          }
      
          setComments((previousComments) => [
            ...previousComments,
            data.comment,
          ]);
      
          setNewComment("");
        } catch (error) {
          window.alert(error.message || "Unable to add comment");
        }
      };
    const [showCreateClaim, setShowCreateClaim] = useState(false);
    const [claimsRefresh, setClaimsRefresh] = useState(0);

const handleLogout = () => {
  dispatch(logout());
  onLogout();
};


const handleViewReceipt = async (attachment) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/claims/receipts/${attachment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to open receipt");
      }
  
      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = fileURL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
  
      setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
    } catch (error) {
      console.error("Error viewing receipt:", error);
      alert("Unable to open receipt.");
    }
  };

  
  

  const [claims, setClaims] = useState([]);
  
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState("");
const [claimsMessage, setClaimsMessage] = useState("Loading claims...");


useEffect(() => {
    const fetchClaims = async () => {
      try {
        setClaimsMessage("Loading claims...");
  
        const response = await fetch(
          "http://localhost:5001/api/claims",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch claims");
        }
  
        setClaims(data.claims);
        setClaimsMessage("");
      } catch (error) {
        console.error("Error fetching claims:", error);
        setClaimsMessage(error.message || "Unable to load claims");
      }
    };
  
    if (token) {
      fetchClaims();
    } else {
      setClaimsMessage("Please log in to view your claims.");
    }
  }, [token, claimsRefresh]);
  

const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    department: "",
    phone: "",
  });
  
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  
const pendingCount = claims.filter(
    (claim) => claim.status === "PENDING"
  ).length;
  
  const approvedCount = claims.filter(
    (claim) => claim.status === "APPROVED"
  ).length;
  
  const rejectedCount = claims.filter(
    (claim) => claim.status === "REJECTED"
  ).length;
  

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }
  
        setProfile(data.user);
      } catch (error) {
        setProfileMessage(error.message || "Unable to load profile");
      }
    };
  
    if (token) {
      fetchProfile();
    }
  }, [token]);
  
  useEffect(() => {
    if (!selectedClaim || !token) return;
  
    const fetchComments = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/comments/${selectedClaim.id}`,
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
        setComments([]);
      }
    };
  
    fetchComments();
  }, [selectedClaim, token]);

  useEffect(() => {
    if (!selectedClaim || !token) return;
  
    const fetchComments = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/api/comments/${selectedClaim.id}`,
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
        setComments([]);
      }
    };
  
    fetchComments();
  }, [selectedClaim, token]);
  if (showCreateClaim) {
    return (
      <CreateClaim
      onBack={() => {
        setShowCreateClaim(false);
        setClaimsRefresh((previous) => previous + 1);
      }}
      />
    );
  }
  if (selectedClaim) {
    return (
      <div>
        <h1>Expense Claim Details</h1>
  
        <p>Claim ID: {selectedClaim.id}</p>
        <p>Category: {selectedClaim.category_name}</p>
        <p>Expense Date: {selectedClaim.expense_date.split("T")[0]}</p>
        <p>Description: {selectedClaim.description}</p>
        <p>Quantity: {selectedClaim.quantity}</p>
        <p>Unit Price: ₹{Number(selectedClaim.unit_price).toFixed(2)}</p>
        <p>Total Amount: ₹{Number(selectedClaim.total_amount).toFixed(2)}</p>
        <p>Status: {selectedClaim.status}</p>

        <h2>Comments</h2>

{comments.length === 0 ? (
  <p>No comments yet.</p>
) : (
  comments.map((comment) => (
    <div key={comment.id}>
      <p>
        <strong>{comment.full_name}</strong>: {comment.message}
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
  
        <button onClick={() => setSelectedClaim(null)}>
          Back to Dashboard
        </button>
      </div>
    );
  }
    return (
      <div>
        <h1>Employee Dashboard</h1>
        <p>Welcome, {user?.full_name || "Employee"}!</p>
<p>Role: {user?.role || "EMPLOYEE"}</p>
<button onClick={handleLogout}>Logout</button>

<hr />

<h2>My Profile</h2>

{profileMessage && <p>{profileMessage}</p>}

<form
  onSubmit={async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");

    try {
      const response = await fetch(
        "http://localhost:5001/api/users/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: profile.full_name,
            department: profile.department,
            phone: profile.phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setProfile(data.user);
      setProfileMessage("Profile updated successfully!");
    } catch (error) {
      setProfileMessage(error.message || "Unable to update profile");
    } finally {
      setProfileLoading(false);
    }
  }}
>
  <div>
    <label htmlFor="profile-name">Full Name</label>
    <input
      id="profile-name"
      value={profile.full_name}
      onChange={(e) =>
        setProfile({ ...profile, full_name: e.target.value })
      }
      required
    />
  </div>

  <div>
    <label htmlFor="profile-email">Email</label>
    <input
      id="profile-email"
      type="email"
      value={profile.email}
      readOnly
    />
  </div>

  <div>
    <label htmlFor="profile-department">Department</label>
    <input
      id="profile-department"
      value={profile.department || ""}
      onChange={(e) =>
        setProfile({ ...profile, department: e.target.value })
      }
    />
  </div>

  <div>
    <label htmlFor="profile-phone">Phone</label>
    <input
      id="profile-phone"
      type="tel"
      value={profile.phone || ""}
      onChange={(e) =>
        setProfile({ ...profile, phone: e.target.value })
      }
    />
  </div>

  <button type="submit" disabled={profileLoading}>
    {profileLoading ? "Saving..." : "Update Profile"}
  </button>
</form>

<hr />

        <h2>My Expense Claims</h2>
        {claimsMessage && <p>{claimsMessage}</p>}

{claims.length === 0 && !claimsMessage && (
  <p>No expense claims found.</p>
)}

{claims.map((claim) => (
  <div key={claim.id}>
    <h3>{claim.category_name}</h3>
    <p>Expense Date: {claim.expense_date.split("T")[0]}</p>
    <p>Description: {claim.description}</p>
    <p>Total Amount: ₹{Number(claim.total_amount).toFixed(2)}</p>
    <p>Status: {claim.status}</p>
    <button onClick={() => setSelectedClaim(claim)}>
  View Details
</button>

{claim.attachments?.map((attachment) => (
  <button
    key={attachment.id}
    onClick={() => handleViewReceipt(attachment)}
  >
    View Receipt: {attachment.original_name}
  </button>
))}

    {claim.status === "PENDING" && (
      <button onClick={() => handleCancelClaim(claim.id)}>
        Cancel Claim
      </button>
    )}
  </div>
))}

        <div>
          <h3>Pending</h3>
          <p>{pendingCount}</p>
        </div>
  
        <div>
          <h3>Approved</h3>
          <p>{approvedCount}</p>
        </div>
  
        <div>
          <h3>Rejected</h3>
          <p>{rejectedCount}</p>
        </div>
  
        <button onClick={() => setShowCreateClaim(true)}>
  Apply for Expense Reimbursement
</button>
      </div>
    );
  }
  
  export default Dashboard;
  
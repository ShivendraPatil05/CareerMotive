document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const statusMessage = document.getElementById('status-message');
    const submitBtn = document.querySelector('.submit-btn');
    const adminList = document.getElementById('admin-opportunities-list');

    let editingId = null;

    // Initialize Quill Editor
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Write the description with formatting...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean'] // remove formatting button
            ]
        }
    });

    // Load all opportunities for management
    async function loadAdminOpportunities() {
        try {
            const response = await fetch('/api/opportunities');
            const data = await response.json();
            
            adminList.innerHTML = '';
            
            if (data.length === 0) {
                adminList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No opportunities published yet. Upload one above!</p>';
                return;
            }

            data.forEach(opp => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.innerHTML = `
                    <div class="info">
                        <strong>${opp.title}</strong>
                        <span style="display:block; font-size: 0.8rem; color: var(--text-secondary);">${opp.category}</span>
                    </div>
                    <div class="actions">
                        <button class="btn btn-outline edit-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Edit</button>
                        <button class="btn btn-outline delete-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; color: #ef4444; border-color: rgba(239,68,68,0.3);">Delete</button>
                    </div>
                `;
                
                // Edit Click
                item.querySelector('.edit-btn').addEventListener('click', () => {
                    editingId = opp.id;
                    document.getElementById('title').value = opp.title;
                    document.getElementById('category').value = opp.category;
                    quill.root.innerHTML = opp.description;
                    document.getElementById('deadline').value = opp.deadline || '';
                    document.getElementById('url').value = opp.url;
                    
                    submitBtn.innerText = 'Update Opportunity';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                // Delete Click
                item.querySelector('.delete-btn').addEventListener('click', async () => {
                    const secret = document.getElementById('admin_secret').value;
                    if (!secret) {
                        alert("Please enter the Admin Password in the form above to delete anything.");
                        return;
                    }

                    if(confirm(`Are you sure you want to delete "${opp.title}"?`)) {
                        try {
                            const delResponse = await fetch(`/api/opportunities/${opp.id}?admin_secret=${encodeURIComponent(secret)}`, {
                                method: 'DELETE'
                            });
                            
                            if (delResponse.ok) {
                                loadAdminOpportunities();
                            } else {
                                const err = await delResponse.json();
                                alert("Failed: " + err.detail);
                            }
                        } catch(e) {
                            alert("Error deleting.");
                        }
                    }
                });

                adminList.appendChild(item);
            });
        } catch (error) {
            adminList.innerHTML = '<p>Failed to load opportunities.</p>';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        statusMessage.innerText = '';
        statusMessage.style.color = '';
        submitBtn.disabled = true;
        submitBtn.innerText = editingId ? 'Updating...' : 'Publishing...';

        const payload = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            description: quill.root.innerHTML,
            deadline: document.getElementById('deadline').value || null,
            url: document.getElementById('url').value,
            admin_secret: document.getElementById('admin_secret').value
        };

        try {
            const endpoint = editingId ? `/api/opportunities/${editingId}` : '/api/opportunities';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                statusMessage.innerText = editingId ? 'Opportunity updated successfully!' : 'Opportunity published successfully!';
                statusMessage.style.color = '#10b981'; // Green
                
                // Reset form but keep the password
                const pw = document.getElementById('admin_secret').value;
                form.reset();
                quill.setText('');
                document.getElementById('admin_secret').value = pw;

                editingId = null;
                submitBtn.innerText = 'Publish Opportunity';
                
                loadAdminOpportunities();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to process request');
            }
        } catch (error) {
            statusMessage.innerText = `Error: ${error.message}`;
            statusMessage.style.color = '#ef4444'; // Red
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Load Service Requests into the new Inbox
    async function loadServiceRequests() {
        const reqList = document.getElementById('admin-requests-list');
        if(!reqList) return;
        
        try {
            const response = await fetch('/api/requests');
            const data = await response.json();
            
            reqList.innerHTML = '';
            
            if (data.length === 0) {
                reqList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 3rem; background: rgba(0,0,0,0.2); border-radius: 12px;">Your inbox is currently empty. No new service requests yet.</p>';
                return;
            }

            data.forEach(req => {
                const item = document.createElement('div');
                item.className = 'admin-list-item';
                item.style.flexDirection = 'column';
                item.style.alignItems = 'flex-start';
                item.style.padding = '2rem';
                
                const timeStr = new Date(req.created_at).toLocaleString();
                
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <strong style="font-size: 1.3rem; color: var(--text-primary); display: block; margin-bottom: 0.2rem;">${req.name}</strong>
                            <span style="color: var(--text-secondary); font-size: 0.95rem;">📧 ${req.email}</span>
                        </div>
                        <span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; height: fit-content; font-size: 0.9rem;">${req.service}</span>
                    </div>
                    <div style="width: 100%; background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); color: var(--text-primary); white-space: pre-wrap; font-size: 1.05rem; line-height: 1.5; margin-bottom: 1.5rem;">${req.message}</div>
                    
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">Received: ${timeStr}</span>
                        <a href="mailto:${req.email}?subject=Re: ${req.service} Service Request - Career Motive" class="btn btn-primary" style="text-decoration: none; padding: 0.6rem 1.2rem; font-size: 0.9rem;">Reply via Email</a>
                    </div>
                `;
                reqList.appendChild(item);
            });
        } catch(error) {
            reqList.innerHTML = '<p style="color:red; text-align:center;">Failed to load inbox properly.</p>';
        }
    }

    // Initial loads
    loadAdminOpportunities();
    loadServiceRequests();
});

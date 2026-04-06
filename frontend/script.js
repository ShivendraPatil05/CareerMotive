document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('opportunities-grid');
    const loader = document.getElementById('loader');
    const filterLinks = document.querySelectorAll('.nav-links a[data-filter]');
    const categoryTitle = document.getElementById('current-category');

    // Fetch opportunities from API
    async function fetchOpportunities(category = 'All') {
        loader.style.display = 'flex';
        grid.innerHTML = '';
        
        try {
            const url = category === 'All' ? '/api/opportunities' : `/api/opportunities?category=${category}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            
            renderOpportunities(data);
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p style="color: red; text-align: center; width: 100%;">Failed to load opportunities.</p>';
        } finally {
            loader.style.display = 'none';
        }
    }

    // Render cards to the grid
    function renderOpportunities(opportunities) {
        if (opportunities.length === 0) {
            grid.innerHTML = '<p style="text-align: center; width: 100%; color: var(--text-secondary);">No opportunities found for this category yet.</p>';
            return;
        }

        opportunities.forEach(opp => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const formattedDate = opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'No Deadline';
            
            // Format the category string into a valid CSS class name (e.g., "Exchange Program" -> "exchange")
            const badgeClass = opp.category.split(' ')[0].toLowerCase();

            card.innerHTML = `
                <div class="card-header">
                    <span class="badge ${badgeClass}">${opp.category}</span>
                </div>
                <h3 class="card-title">${opp.title}</h3>
                <div class="card-desc">${opp.description}</div>
                
                <div class="card-footer">
                    <span class="deadline">
                        Deadline: ${formattedDate}
                    </span>
                    <a href="${opp.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">View Details</a>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

        // Filter functionality
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-filter');
            
            // Update active state
            filterLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update title
            categoryTitle.innerText = category === 'All' ? 'Latest Opportunities' : `${category} Opportunities`;
            
            // Fetch data
            fetchOpportunities(category);
        });
    });

    // Initial load
    fetchOpportunities();
});

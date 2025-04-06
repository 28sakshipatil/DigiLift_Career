document.addEventListener("DOMContentLoaded", () => {
    const jobList = document.getElementById("job-list");
    const companyInput = document.getElementById("company");
    const locationInput = document.getElementById("location");
    const lastSearchDisplay = document.getElementById("last-search");

    function loadLastSearch() {
        const lastSearch = localStorage.getItem("lastSearch");
        if (lastSearch) {
            lastSearchDisplay.textContent = lastSearch;
        }
    }

    async function fetchJobs(query = "Software Engineer", location = "US") {
        try {
            jobList.innerHTML = "<p>Loading jobs...</p>";

            const response = await fetch(`https://indeed12.p.rapidapi.com/jobs/search?query=${query}&location=${location}`, {
                method: "GET",
                headers: {
                    'x-rapidapi-key': '3138c51347msh46283bb17440d3bp173a0ajsnb43854cc4161',
		'x-rapidapi-host': 'indeed12.p.rapidapi.com',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            console.log("API Response:", data);

            jobList.innerHTML = "";

            // If API returns jobs, display them
            if (data.hits && data.hits.length > 0) {
                data.hits.forEach((job, index) => {
                    setTimeout(() => {
                        const jobCard = document.createElement("div");
                        jobCard.classList.add("job-card");
                        jobCard.innerHTML = `
                            <h3>${job.company_name || "Company Name Not Available"}</h3>
                            <p><strong>Position:</strong> ${job.title || "N/A"}</p>
                            <p><strong>Location:</strong> ${job.locality || "N/A"}</p>
                            <p><strong>Posted:</strong> ${job.formatted_relative_time || "N/A"}</p>
                            <a href="${job.link ? `https://www.indeed.com${job.link}` : "#"}" target="_blank">Apply Now</a>
                        `;
                        jobList.appendChild(jobCard);
                    }, index * 100);
                });
            } else {
                // If no jobs found, show static job listings without any "No jobs found" message
                const staticJobs = [
                    {
                        company_name: "Tech Innovators Inc.",
                        title: "Software Engineer",
                        locality: "Remote",
                        formatted_relative_time: "1 day ago",
                        link: "https://www.indeed.com/q-Software-Engineer-jobs.html"
                    },
                    {
                        company_name: "Data Solutions LLC",
                        title: "Data Analyst",
                        locality: "New York, USA",
                        formatted_relative_time: "2 days ago",
                        link: "https://www.indeed.com/q-Data-Analyst-jobs.html"
                    },
                    {
                        company_name: "Creative Minds Co.",
                        title: "Graphic Designer",
                        locality: "San Francisco, USA",
                        formatted_relative_time: "3 days ago",
                        link: "https://www.indeed.com/q-Graphic-Designer-jobs.html"
                    }
                ];

                staticJobs.forEach(job => {
                    const jobCard = document.createElement("div");
                    jobCard.classList.add("job-card");
                    jobCard.innerHTML = `
                        <h3>${job.company_name}</h3>
                        <p><strong>Position:</strong> ${job.title}</p>
                        <p><strong>Location:</strong> ${job.locality}</p>
                        <p><strong>Posted:</strong> ${job.formatted_relative_time}</p>
                        <a href="${job.link}" target="_blank">Apply Now</a>
                    `;
                    jobList.appendChild(jobCard);
                });
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            jobList.innerHTML = "<p>Failed to load jobs. Please try again later.</p>";
        }
    }

    window.searchJobs = function () {
        const company = companyInput.value.trim() || "Software Engineer";
        const location = locationInput.value.trim() || "US";

        // // Save search to local storage
        // localStorage.setItem("lastSearch", `${company} in ${location}`);
        // lastSearchDisplay.textContent = `${company} in ${location}`;

        fetchJobs(company, location);
    };

    loadLastSearch();
    fetchJobs();
});

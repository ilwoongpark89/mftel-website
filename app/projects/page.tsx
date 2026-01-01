export default function Projects() {
  const projects = [
    {
      year: "2025",
      title: "Research on improving the cooling performance of the HiMSEN engine pre-combustion chamber",
      sponsor: "HD Hyundai Heavy Industry"
    },
    {
      year: "2025",
      title: "Development of Thermal Energy Storage",
      sponsor: "Laboratory-Specialized Startup Leading University, Ministry of Science and Technology"
    },
    {
      year: "2025",
      title: "Basic Research on Electric Vehicle Battery Cooling Using Insulating Fluid Boiling Heat Transfer",
      sponsor: "Inha University"
    },
    {
      year: "2025-2028",
      title: "Synergy for Safe and Sustainable Ocean in Norway and Korea (SONoKo)",
      sponsor: "UTFORSK, Direktoratet for høyere utdanning og kompetanse (HK-dir), Norway"
    },
    {
      year: "2024-2025",
      title: "Global human resources training project to secure major design technologies for next-generation SMR safety enhancement",
      sponsor: "KETEP"
    },
    {
      year: "2024",
      title: "Development of a yard exhaust pipe explosion pressure prediction model",
      sponsor: "HD Hyundai Heavy Industry"
    },
    {
      year: "2023-2027",
      title: "Digital-Based Sustainable Energy Process Innovation Convergence Graduate School",
      sponsor: "KETEP"
    },
    {
      year: "2023-2025",
      title: "Development of direct contact latent heat storage system",
      sponsor: "National Research Foundation of Korea"
    },
    {
      year: "2023-2025",
      title: "Identification of two-phase flow instabilities in a multi-channel system",
      sponsor: "National Research Foundation of Korea"
    },
    {
      year: "2023",
      title: "Control of wettability and enhancement of phase-change heat transfer by microstructures",
      sponsor: "ROK-Nordic R&D Cooperation Program, National Research Foundation of Korea"
    },
    {
      year: "2022-2029",
      title: "Validation of core safety issues in response to strengthening technical criteria and development of technology to improve core safety in multiple failure accident",
      sponsor: "National Research Foundation of Korea"
    },
    {
      year: "2018-2021",
      title: "Improvement of wall boiling model based on boiling experiment with a controlled surface in microscale",
      sponsor: "National Research Foundation of Korea"
    }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Research Projects</h1>
          <p className="text-gray-600 mt-2">Total: {projects.length} Projects</p>
        </div>

        <div className="space-y-6">
          {projects.map((project, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-6">
                  <div className="bg-blue-900 text-white rounded-lg px-4 py-2 text-center">
                    <div className="text-sm font-semibold whitespace-nowrap">{project.year}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {project.title}
                  </h3>
                  <div className="flex items-start">
                    <span className="text-sm font-semibold text-blue-900 mr-2">Sponsor:</span>
                    <p className="text-gray-700 text-sm">
                      {project.sponsor}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

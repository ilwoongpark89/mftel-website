import Image from 'next/image';

export default function Research() {
  const researchAreas = [
    {
      title: "Boiling Heat Transfer Experiment",
      image: "Boiling Heat Transfer Experiement.png",
      description: "Advanced experimental studies on pool and flow boiling phenomena"
    },
    {
      title: "Flow Instability Experiment",
      image: "Flow instability Experiement.png",
      description: "Investigation of two-phase flow instabilities in multi-channel systems"
    },
    {
      title: "Leidenfrost Experiment",
      image: "Leidenfrost Experiement.png",
      description: "Study of the Leidenfrost effect and film boiling phenomena"
    },
    {
      title: "Multi-Scale and Multi-D Simulation",
      image: "Multi-Scale and Multi-D simulation.png",
      description: "Computational modeling of thermal-hydraulic phenomena at multiple scales"
    },
    {
      title: "Thermal Energy Storage",
      image: "Thermal Energy Storage.png",
      description: "Development of sustainable thermal energy storage systems using sand and rock materials"
    }
  ];

  const labEvents = [
    {
      title: "KSFM2024 in Jeju",
      date: "December 2024",
      image: "2024. 12. @MFTEL : KSFM2024 in Jeju.jpg"
    },
    {
      title: "Hyeon Geun Shin: Presentation at 11th WORTH, China",
      date: "May 2025",
      image: "2025. 05. @Hyeon Geun Shin : Presentation at 11th WORTH, China.jpg"
    },
    {
      title: "UTFORSK 2024 Field Trip to NTNU, Norway",
      date: "August 2025",
      image: "2025. 08. @MFTEL : UTFORSK 2024 Field Trip to NTNU, Norway .jpg"
    },
    {
      title: "HyeonJin Yong: Visiting Research at HZDR, Germany",
      date: "March - September 2025",
      image: "2025. 03. - 2025. 09. @HyeonJin Yong : Visiting research at HZDR, Germany.jpg"
    },
    {
      title: "Kyeong Ju Ko: Visiting Research at UPC, Spain",
      date: "March - September 2025",
      image: "2025. 03. - 2025. 09. @Kyeong Ju Ko : Visiting research at UPC, Spain.jpg"
    }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Research Areas Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900">Research Areas</h1>
            <p className="text-gray-600 mt-2">Our core research focus and experimental facilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {researchAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={`/images/${area.image}`}
                    alt={area.title}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{area.title}</h3>
                  <p className="text-gray-700">{area.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lab Events Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Lab Events & Activities</h2>
            <p className="text-gray-600 mt-2">Conferences, visits, and collaborations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {labEvents.map((event, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={`/images/${event.image}`}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-blue-900 font-semibold mb-2">{event.date}</p>
                  <h3 className="text-base font-bold text-gray-900">{event.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

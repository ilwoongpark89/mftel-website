'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const [showAllPublications, setShowAllPublications] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const publications = [
    { number: 23, authors: "Hyunjin Yong, Jaehyeok Yang, Yunseok Choi, Il Woong Park*, Sai Raja Gopal Vadlamudi, Uwe Hampel, Hyun Sun Park", title: "Experimental Study on the Influence of Sub-Millimeter Copper Foams on Boiling Heat Transfer in Vertical Orientation", journal: "International Communications in Heat and Mass Transfer", year: "2026", link: "https://doi.org/10.1016/j.icheatmasstransfer.2025.110346" },
    { number: 22, authors: "Jaehyeok Yang, Hyunjin Yong, Sungjin Kim, Il Woong Park*, Yeon-Gun Lee, Sai Raja Gopal Vadlamudi, Hyun Sun Park", title: "Critical Heat Flux Dependence on Surface Orientation and Bubble Dynamics in Pool Boiling over Silicon and Silicon Dioxide Surfaces", journal: "International Journal of Energy Research", year: "2025", link: "https://doi.org/10.1155/er/6413134" },
    { number: 21, authors: "Sung Jin Kim, Yun Seok Choi, Il Woong Park*, Young Beom Jo, Hyun Sun Park", title: "A review of metal foam-enhanced pool boiling", journal: "Renewable and Sustainable Energy Reviews", year: "2025", link: "https://doi.org/10.1016/j.rser.2024.115176" },
    { number: 20, authors: "Yun Seok Choi, Sung Jin Kim, Il Woong Park*, Hyun Sun Park, Yeon-Gun Lee", title: "Experimental investigation on the influence of copper foam characteristics on pool boiling heat transfer", journal: "International Communications in Heat and Mass Transfer", year: "2024", link: "https://doi.org/10.1016/j.icheatmasstransfer.2024.108318" },
    { number: 19, authors: "Il Woong Park, Jia Yu, Sang Min Song, Yeon-Gun Lee", title: "Characteristics of Hydrogen Distribution Under Steam Condensation in an Enclosed Vessel: Steady and Transient States Tests", journal: "International Journal of Energy Research", year: "2023", link: "https://doi.org/10.1155/2023/8876673" },
    { number: 18, authors: "Il Woong Park, Jonas M. Ribe, Maria Fernandino, Carlos Alberto Dorao", title: "The criterion of the Cassie–Baxter and Wenzel wetting modes and the effect of elastic substrates on it", journal: "Advanced Materials Interfaces", year: "2023", link: "https://doi.org/10.1002/admi.202202439" },
    { number: 17, authors: "Yeon-Gun Lee, Il Woong Park", title: "Numerical evaluation of coolability limits of external reactor vessel cooling using an improved thermal-hydraulic system analysis code", journal: "International Journal of Energy Research", year: "2023", link: "https://doi.org/10.1155/2023/2375012" },
    { number: 16, authors: "Il Woong Park, Si-Hyeok Yang, Yeon-gun Lee", title: "Degradation of condensation heat transfer on vertical cylinder by light noncondensable gas mixed with air-steam mixtures", journal: "International Communications in Heat and Mass Transfer", year: "2022", link: "https://doi.org/10.1016/j.icheatmasstransfer.2021.105779" },
    { number: 15, authors: "Min Seop Song, Il Woong Park, Eung Soo Kim, Yeon-Gun Lee", title: "Numerical study on thermal-hydraulics of external reactor vessel cooling in high-power reactor using MARS-KS1.5 code: CFD-aided estimation of natural circulation flow rate", journal: "Nuclear Engineering and Technology", year: "2022", link: "https://doi.org/10.1016/j.net.2021.07.037" },
    { number: 14, authors: "Il Woong Park, In Yeop Kang, Jia Yu, Yeon-Gun Lee", title: "Bubble lift-off diameter of lifting-off and ejecting bubbles in subcooled flow boiling", journal: "International Communications in Heat and Mass Transfer", year: "2021", link: "https://doi.org/10.1016/j.icheatmasstransfer.2021.105727" },
    { number: 13, authors: "Il Woong Park*, In Yeop Kang, Hyeon Jin Yong", title: "Flow boiling instability induced by the coexistence of ejecting and sliding bubbles in subcooled flow boiling", journal: "International Journal of Heat and Mass Transfer", year: "2021", link: "https://doi.org/10.1016/j.ijheatmasstransfer.2021.121711" },
    { number: 12, authors: "Il Woong Park, Si-Hyeok Yang, Yeon-gun Lee", title: "Effect of light gas on condensation heat transfer of steam–air mixture and gas stratification", journal: "International Journal of Heat and Mass Transfer", year: "2021", link: "https://doi.org/10.1016/j.ijheatmasstransfer.2021.121716" },
    { number: 11, authors: "Il Woong Park, Sin Kim, Yeon-Gun Lee", title: "The profiles of the local void fraction close to the heated wall in the subcooled flow boiling", journal: "International Journal of Heat and Mass Transfer", year: "2020", link: "https://doi.org/10.1016/j.ijheatmasstransfer.2020.119438" },
    { number: 10, authors: "Yeon-GunLee, Il Woong Park, Ji-Woong Yoo, Sin Kim", title: "Measurement of multi-dimensional distribution of local bubble parameters in a vertical annulus under subcooled boiling conditions", journal: "International Journal of Heat and Mass Transfer", year: "2019", link: "https://doi.org/10.1016/j.ijheatmasstransfer.2019.05.106" },
    { number: 9, authors: "Tomasz Muszyński, Rafał Andrzejczyk, Il Wong Park, Carlos Alberto Dorao", title: "Heat transfer and pressure drop characteristics of the silicone-based plate heat exchanger", journal: "Archives of Thermodynamics", year: "2019", link: "https://journals.pan.pl/Content/111924/PDF/08_paper.pdf" },
    { number: 8, authors: "Il Woong Park, Maria Fernandino, Carlos Alberto Dorao", title: "Wetting state transitions over hierarchical conical microstructures", journal: "Advanced Materials Interfaces", year: "2018", link: "https://doi.org/10.1002/admi.201701039" },
    { number: 7, authors: "Il Woong Park, Jeongrim Ryu, Maria Fernandino, Carlos Alberto Dorao", title: "Can flow oscillations during flow boiling deteriorate the heat transfer coefficient?", journal: "Applied Physics Letters", year: "2018", link: "https://doi.org/10.1063/1.5046429" },
    { number: 6, authors: "Il Woong Park, Maria Fernandino, Carlos Alberto Dorao", title: "On the occurrence of superimposed density wave oscillations on pressure drop oscillations and the influence of a compressible volume", journal: "AIP Advances", year: "2018", link: "https://doi.org/10.1063/1.5040113" },
    { number: 5, authors: "Il Woong Park, Maria Fernandino, Carlos Alberto Dorao", title: "Experimental study on the characteristics of pressure drop oscillations and their interaction with short-period oscillation in a horizontal tube", journal: "International Journal of Refrigeration", year: "2018", link: "https://doi.org/10.1016/j.ijrefrig.2018.05.008" },
    { number: 4, authors: "Yeon-Gun Lee, Il Woong Park, Dong-Won Lee, Goon-Cherl Park, Eung-Soo Kim", title: "Reduction of circulation power for helium-cooled fusion reactor blanket using additive CO2 gas", journal: "Fusion Engineering and Design", year: "2015", link: "https://doi.org/10.1016/j.fusengdes.2015.07.010" },
    { number: 3, authors: "Jeong-Hun Lee, Il Woong Park, Geon-Woo Kim, Goon-Cherl Park, Hyoung-Kyu Cho, Ki hak Im", title: "Thermal-hydraulic analysis of water cooled breeding blanket of K-DEMO using MARS-KS code", journal: "Fusion Engineering and Design", year: "2015", link: "https://doi.org/10.1016/j.fusengdes.2015.05.029" },
    { number: 2, authors: "Su-Jong Yoon, Min-Seop Song, Il Woong Park, Dong-Won Lee, Goon-Cherl Park, Eung-Soo Kim", title: "Assessment of COMSOL capability to analyze thermal-hydraulic characteristics of Korean helium cooled test blanket", journal: "Fusion Engineering and Design", year: "2013", link: "https://doi.org/10.1016/j.fusengdes.2013.02.016" },
    { number: 1, authors: "Yeon-Gun Lee, Il Woong Park, Goon-Cherl Park", title: "SBLOCA and LOFW experiments in a scaled-down IET facility of rex-10 reactor", journal: "Nuclear Engineering and Technology", year: "2013", link: "https://doi.org/10.5516/NET.02.2013.024" },
  ];

  const patents = [
    { title: "Super hydrophobic flexible sheet and manufacturing method", number: "10-2023-0069264" },
    { title: "Battery immersion cooling by boiling with gas-liquid flow path separation", number: "10-2855737", date: "2025-09-02" }
  ];

  const projects = [
    { year: "2025", title: "Research on improving the cooling performance of the HiMSEN engine pre-combustion chamber", sponsor: "HD Hyundai Heavy Industry" },
    { year: "2025", title: "Development of Thermal Energy Storage", sponsor: "Laboratory-Specialized Startup Leading University, Ministry of Science and Technology" },
    { year: "2025", title: "Basic Research on Electric Vehicle Battery Cooling Using Insulating Fluid Boiling Heat Transfer", sponsor: "Inha University" },
    { year: "2025-2028", title: "Synergy for Safe and Sustainable Ocean in Norway and Korea (SONoKo)", sponsor: "UTFORSK, Direktoratet for høyere utdanning og kompetanse (HK-dir), Norway" },
    { year: "2024-2025", title: "Global human resources training project to secure major design technologies for next-generation SMR safety enhancement", sponsor: "KETEP" },
    { year: "2024", title: "Development of a yard exhaust pipe explosion pressure prediction model", sponsor: "HD Hyundai Heavy Industry" },
    { year: "2023-2027", title: "Digital-Based Sustainable Energy Process Innovation Convergence Graduate School", sponsor: "KETEP" },
    { year: "2023-2025", title: "Development of direct contact latent heat storage system", sponsor: "National Research Foundation of Korea" },
    { year: "2023-2025", title: "Identification of two-phase flow instabilities in a multi-channel system", sponsor: "National Research Foundation of Korea" },
    { year: "2023", title: "Control of wettability and enhancement of phase-change heat transfer by microstructures", sponsor: "ROK-Nordic R&D Cooperation Program, National Research Foundation of Korea" },
    { year: "2022-2029", title: "Validation of core safety issues in response to strengthening technical criteria and development of technology to improve core safety in multiple failure accident", sponsor: "National Research Foundation of Korea" },
    { year: "2018-2021", title: "Improvement of wall boiling model based on boiling experiment with a controlled surface in microscale", sponsor: "National Research Foundation of Korea" },
  ];

  const teamMembers = [
    { name: "Hyun Jin Yong", degree: "Ph.D. student", research: "Boiling heat transfer" },
    { name: "Jun Beom Song", degree: "Ph.D. student", research: "Thermal energy storage" },
    { name: "Sang Min Song", degree: "Ph.D. student", research: "Condensation" },
    { name: "Jae Hyeok Yang", degree: "Ph.D. student", research: "Thermal-hydraulic system code" },
    { name: "Hyeon Geun Shin", degree: "Ph.D. student", research: "Two-phase flow instability" },
    { name: "Sung Jin Kim", degree: "Ph.D. student", research: "Boiling, Dielectric fluid" },
    { name: "Kyeong Ju Ko", degree: "M.S. student", research: "Computational fluid dynamics" },
    { name: "Chaeyeon Kim", degree: "M.S. student", research: "Phase-change heat transfer" },
    { name: "Eunbin Park", degree: "M.S. student", research: "Two-phase flow instability" },
    { name: "Manho Kim", degree: "M.S. student", research: "Computational fluid dynamics" },
    { name: "Joonhwan Hyun", degree: "M.S. student", research: "Thermal energy storage" },
    { name: "Yeongjun Jung", degree: "M.S. student", research: "Boiling heat transfer" }
  ];

  const alumni = [
    { name: "Yun Seok Choi", year: "2025 M.S.", position: "Korea Hydro and Nuclear Power (KHNP) Central Research Institute" }
  ];

  const researchAreas = [
    { title: "Boiling Heat Transfer", image: "Boiling Heat Transfer Experiement.png" },
    { title: "Flow Instability", image: "Flow instability Experiement.png" },
    { title: "Leidenfrost Effect", image: "Leidenfrost Experiement.png" },
    { title: "Multi-Scale Simulation", image: "Multi-Scale and Multi-D simulation.png" },
    { title: "Thermal Energy Storage", image: "Thermal Energy Storage.png" }
  ];

  const galleryImages = [
    { title: "HyeonJin Yong & Kyeong Ju Ko: Visiting Research", date: "March - September 2025", image: "2025. 03. - 2025. 09. @HyeonJin Yong : Visiting research at HZDR, Germany.jpg", sortDate: "2025-09" },
    { title: "UTFORSK 2024 Field Trip to NTNU, Norway", date: "August 2025", image: "2025. 08. @MFTEL : UTFORSK 2024 Field Trip to NTNU, Norway .jpg", sortDate: "2025-08" },
    { title: "Hyeon Geun Shin: Presentation at 11th WORTH, China", date: "May 2025", image: "2025. 05. @Hyeon Geun Shin : Presentation at 11th WORTH, China.jpg", sortDate: "2025-05" },
    { title: "KSFM2024 in Jeju", date: "December 2024", image: "2024. 12. @MFTEL : KSFM2024 in Jeju.jpg", sortDate: "2024-12" },
    { title: "Yun Seok Choi (Best Paper Award): WORTH-10 in Jeju", date: "November 2023", image: "2023. 11.  @Yun Seok Choi (Best Paper Award) : WORTH-10 in Jeju.png", sortDate: "2023-11" },
    { title: "Junbeom Song: GPPS Hong Kong 23", date: "October 2023", image: "2023. 10.   @Junbeom Song : GPPS Hong Kong 23, Hong Kong.png", sortDate: "2023-10" },
    { title: "ICMF in Kobe, Japan", date: "April 2023", image: "2023. 04.  ICMF in Kobe, Japan.jpg", sortDate: "2023-04-02" },
    { title: "KSME Thermal Engineering Division in Busan", date: "April 2023", image: "2023. 04.  KSME Thermal Engineering Division in Busan.jpg", sortDate: "2023-04-01" }
  ].sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h1 className="text-7xl md:text-9xl font-light text-gray-900 tracking-wide">
              MFTEL
            </h1>
            <div className="h-px w-24 bg-[#DC143C] mx-auto"></div>
            <p className="text-xl md:text-2xl text-gray-600 tracking-wider">
              Multiphase Flow and Thermal Engineering Laboratory
            </p>
            <p className="text-base text-gray-500">Inha University</p>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto mt-8 leading-relaxed">
              Engineering a safer, more efficient, and sustainable energy future
            </p>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">About Us</h2>
              <h3 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
                Our Mission
              </h3>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed text-center mb-12">
              The Multiphase Flow and Thermal Engineering Laboratory (MFTEL) at Inha University is driven by a mission to engineer a safer, more efficient, and sustainable energy future.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-l-2 border-[#DC143C] pl-6">
                <h4 className="text-xl font-medium text-gray-900 mb-2">Sustainable Energy Storage</h4>
                <p className="text-gray-600">Pioneering thermal energy storage systems using sand and rock materials for grid stability and power plant retrofit.</p>
              </div>
              <div className="border-l-2 border-[#DC143C] pl-6">
                <h4 className="text-xl font-medium text-gray-900 mb-2">Extreme Heat Management</h4>
                <p className="text-gray-600">Elite cooling solutions for small modular reactors, data centers, and high-performance electronics.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professor Section */}
      <section id="professor" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">Leadership</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Prof. Il Woong Park</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="md:col-span-1">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-gray-100">
                <Image src="/images/Professor_Il Woong Park.png" alt="Prof. Il Woong Park" fill className="object-cover" />
              </div>
            </div>
            <div className="md:col-span-2 space-y-8">
              <div>
                <h4 className="text-xl font-medium text-gray-900 mb-4">Education & Career</h4>
                <div className="space-y-2 text-gray-600">
                  <p>• Assistant Professor, Inha University (2022-)</p>
                  <p>• Research Assistant Professor, Seoul National University (2022)</p>
                  <p>• Research Professor, Jeju National University (2018-2021)</p>
                  <p>• Ph.D., Norwegian University of Science and Technology (2014-2018)</p>
                  <p>• M.S., Seoul National University (2011-2013)</p>
                  <p>• B.S., Seoul National University (2008-2011)</p>
                </div>
              </div>
              <div>
                <h4 className="text-xl font-medium text-gray-900 mb-4">Professional Activities</h4>
                <div className="space-y-2 text-gray-600">
                  <p>• Editor, The Korean Hydrogen and New Energy Society (2024-)</p>
                  <p>• Editor, The Korean Society for New and Renewable Energy (2025-)</p>
                  <p>• Chief Technology Officer, PIOST (2025-)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">People</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Our Team</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                <div className="relative w-full aspect-[3/4] bg-gray-100">
                  <img src={`/images/${member.name}.jpg`} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4 text-center border-t border-gray-100">
                  <p className="text-base font-medium text-gray-900 mb-1">{member.name}</p>
                  <p className="text-sm text-gray-500 mb-1">{member.degree}</p>
                  <p className="text-xs text-gray-400">#{member.research}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Alumni */}
          <div className="mt-20">
            <h3 className="text-3xl font-light text-gray-900 text-center mb-12">Alumni</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {alumni.map((alum, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-8">
                    <div className="min-w-fit">
                      <p className="text-lg font-medium text-gray-900">{alum.name}</p>
                      <p className="text-sm text-gray-500">{alum.year}</p>
                    </div>
                    <p className="text-sm text-gray-600">{alum.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section id="research" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">What We Do</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Research Areas</h3>
          </div>

          {/* Research Areas - 2 per row (Research Network 포함) */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Research Areas */}
            {researchAreas.map((area, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                <div className="relative h-96">
                  <Image src={`/images/${area.image}`} alt={area.title} fill className="object-contain p-8 group-hover:scale-105 transition-transform duration-300" />
                </div>
              </div>
            ))}

            {/* Research Network - 마지막 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-96">
                <Image src="/images/Research Network.png" alt="Research Network" fill className="object-contain p-8 group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section id="publications" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">Our Work</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">Publications</h3>
            <p className="text-gray-500">23 publications in top-tier journals</p>
          </div>
          <div className="space-y-6">
            {(showAllPublications ? publications : publications.slice(0, 3)).map((pub, i) => (
              <a key={i} href={pub.link} target="_blank" className="block group">
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#DC143C] hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#DC143C] to-[#B8102E] rounded-lg flex items-center justify-center text-white font-medium">{pub.number}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-2">{pub.authors}</p>
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-[#DC143C] transition-colors mb-2">{pub.title}</h4>
                      <p className="text-sm text-gray-600">{pub.journal} • {pub.year}</p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {!showAllPublications && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllPublications(true)}
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#DC143C] to-[#B8102E] text-white rounded-full hover:from-[#B8102E] hover:to-[#A0102A] transition-all shadow-lg shadow-[#DC143C]/30"
              >
                View All Publications ({publications.length}) →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Patents Section */}
      <section id="patents" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">Innovation</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Patents</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {patents.map((patent, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-md transition-shadow">
                <h4 className="text-xl font-medium text-gray-900 mb-3">{patent.title}</h4>
                <p className="text-sm text-gray-600">Patent No: {patent.number}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">Funding</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Projects</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {(showAllProjects ? projects : projects.slice(0, 4)).map((proj, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-600 mb-3">{proj.year}</div>
                <h4 className="text-xl font-medium text-gray-900 mb-3">{proj.title}</h4>
                <p className="text-gray-600 text-sm">{proj.sponsor}</p>
              </div>
            ))}
          </div>
          {!showAllProjects && projects.length > 4 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllProjects(true)}
                className="inline-block px-8 py-3 bg-gradient-to-r from-[#DC143C] to-[#B8102E] text-white rounded-full hover:from-[#B8102E] hover:to-[#A0102A] transition-all shadow-lg shadow-[#DC143C]/30"
              >
                View All Projects ({projects.length}) →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">Moments</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Gallery</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {galleryImages.map((item, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="relative h-96 bg-gray-100">
                  <Image src={`/images/${item.image}`} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-2">{item.date}</p>
                  <h4 className="text-base font-medium text-gray-900">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold text-[#DC143C] tracking-widest uppercase mb-2">Get in Touch</h2>
            <h3 className="text-4xl md:text-5xl font-light text-gray-900">Contact</h3>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8">
                <h4 className="text-xl font-medium text-gray-900 mb-4">Location</h4>
                <p className="text-gray-600 mb-2">Inha University</p>
                <p className="text-gray-600">100 Inha-ro, Michuhol-gu</p>
                <p className="text-gray-600">Incheon 22212, Republic of Korea</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8">
                <h4 className="text-xl font-medium text-gray-900 mb-4">Contact Information</h4>
                <p className="text-gray-600 mb-2">Prof. Il Woong Park</p>
                <p className="text-gray-600">Email: ilwoongpark@inha.ac.kr</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} MFTEL, Inha University. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

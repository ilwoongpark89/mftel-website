export default function Publications() {
  const publications = [
    {
      number: 23,
      authors: "Hyunjin Yong, Jaehyeok Yang, Yunseok Choi, Il Woong Park*, Sai Raja Gopal Vadlamudi, Uwe Hampel, Hyun Sun Park",
      title: "Experimental Study on the Influence of Sub-Millimeter Copper Foams on Boiling Heat Transfer in Vertical Orientation",
      journal: "International Communications in Heat and Mass Transfer",
      details: "172, 110346, 2026",
      link: "https://doi.org/10.1016/j.icheatmasstransfer.2025.110346"
    },
    {
      number: 22,
      authors: "Jaehyeok Yang, Hyunjin Yong, Sungjin Kim, Il Woong Park*, Yeon-Gun Lee, Sai Raja Gopal Vadlamudi, Hyun Sun Park",
      title: "Critical Heat Flux Dependence on Surface Orientation and Bubble Dynamics in Pool Boiling over Silicon and Silicon Dioxide Surfaces",
      journal: "International Journal of Energy Research",
      details: "2025, 6413134, 2025",
      link: "https://doi.org/10.1155/er/6413134"
    },
    {
      number: 21,
      authors: "Sung Jin Kim, Yun Seok Choi, Il Woong Park*, Young Beom Jo, Hyun Sun Park",
      title: "A review of metal foam-enhanced pool boiling",
      journal: "Renewable and Sustainable Energy Reviews",
      details: "210, 115176, 2025",
      link: "https://doi.org/10.1016/j.rser.2024.115176"
    },
    {
      number: 20,
      authors: "Yun Seok Choi, Sung Jin Kim, Il Woong Park*, Hyun Sun Park, Yeon-Gun Lee",
      title: "Experimental investigation on the influence of copper foam characteristics on pool boiling heat transfer",
      journal: "International Communications in Heat and Mass Transfer",
      details: "159, 108318, 2024",
      link: "https://doi.org/10.1016/j.icheatmasstransfer.2024.108318"
    },
    {
      number: 19,
      authors: "Il Woong Park, Jia Yu, Sang Min Song, Yeon-Gun Lee",
      title: "Characteristics of Hydrogen Distribution Under Steam Condensation in an Enclosed Vessel: Steady and Transient States Tests",
      journal: "International Journal of Energy Research",
      details: "2023, 8876673, 2023",
      link: "https://doi.org/10.1155/2023/8876673"
    },
    {
      number: 18,
      authors: "Il Woong Park, Jonas M. Ribe, Maria Fernandino, Carlos Alberto Dorao",
      title: "The criterion of the Cassie–Baxter and Wenzel wetting modes and the effect of elastic substrates on it",
      journal: "Advanced Materials Interfaces",
      details: "2202439, 2023",
      link: "https://doi.org/10.1002/admi.202202439",
      special: "Cover Article, Top Viewed Article"
    },
    {
      number: 17,
      authors: "Yeon-Gun Lee, Il Woong Park",
      title: "Numerical evaluation of coolability limits of external reactor vessel cooling using an improved thermal-hydraulic system analysis code",
      journal: "International Journal of Energy Research",
      details: "2023, 2375012, 2023",
      link: "https://doi.org/10.1155/2023/2375012"
    },
    {
      number: 16,
      authors: "Il Woong Park, Si-Hyeok Yang, Yeon-gun Lee",
      title: "Degradation of condensation heat transfer on vertical cylinder by light noncondensable gas mixed with air-steam mixtures",
      journal: "International Communications in Heat and Mass Transfer",
      details: "130, 105779, 2022",
      link: "https://doi.org/10.1016/j.icheatmasstransfer.2021.105779"
    },
    {
      number: 15,
      authors: "Min Seop Song, Il Woong Park, Eung Soo Kim, Yeon-Gun Lee",
      title: "Numerical study on thermal-hydraulics of external reactor vessel cooling in high-power reactor using MARS-KS1.5 code: CFD-aided estimation of natural circulation flow rate",
      journal: "Nuclear Engineering and Technology",
      details: "54, 72, 2022",
      link: "https://doi.org/10.1016/j.net.2021.07.037"
    },
    {
      number: 14,
      authors: "Il Woong Park, In Yeop Kang, Jia Yu, Yeon-Gun Lee",
      title: "Bubble lift-off diameter of lifting-off and ejecting bubbles in subcooled flow boiling",
      journal: "International Communications in Heat and Mass Transfer",
      details: "129, 105727, 2021",
      link: "https://doi.org/10.1016/j.icheatmasstransfer.2021.105727"
    },
    {
      number: 13,
      authors: "Il Woong Park*, In Yeop Kang, Hyeon Jin Yong",
      title: "Flow boiling instability induced by the coexistence of ejecting and sliding bubbles in subcooled flow boiling",
      journal: "International Journal of Heat and Mass Transfer",
      details: "179, 121711, 2021",
      link: "https://doi.org/10.1016/j.ijheatmasstransfer.2021.121711"
    },
    {
      number: 12,
      authors: "Il Woong Park, Si-Hyeok Yang, Yeon-gun Lee",
      title: "Effect of light gas on condensation heat transfer of steam–air mixture and gas stratification",
      journal: "International Journal of Heat and Mass Transfer",
      details: "179, 121716, 2021",
      link: "https://doi.org/10.1016/j.ijheatmasstransfer.2021.121716"
    },
    {
      number: 11,
      authors: "Il Woong Park, Sin Kim, Yeon-Gun Lee",
      title: "The profiles of the local void fraction close to the heated wall in the subcooled flow boiling",
      journal: "International Journal of Heat and Mass Transfer",
      details: "151, 119438, 2020",
      link: "https://doi.org/10.1016/j.ijheatmasstransfer.2020.119438"
    },
    {
      number: 10,
      authors: "Yeon-GunLee, Il Woong Park, Ji-Woong Yoo, Sin Kim",
      title: "Measurement of multi-dimensional distribution of local bubble parameters in a vertical annulus under subcooled boiling conditions",
      journal: "International Journal of Heat and Mass Transfer",
      details: "140, 992, 2019",
      link: "https://doi.org/10.1016/j.ijheatmasstransfer.2019.05.106"
    },
    {
      number: 9,
      authors: "Tomasz Muszyński, Rafał Andrzejczyk, Il Wong Park, Carlos Alberto Dorao",
      title: "Heat transfer and pressure drop characteristics of the silicone-based plate heat exchanger",
      journal: "Archives of Thermodynamics",
      details: "40.1, 2019",
      link: "https://journals.pan.pl/Content/111924/PDF/08_paper.pdf"
    },
    {
      number: 8,
      authors: "Il Woong Park, Maria Fernandino, Carlos Alberto Dorao",
      title: "Wetting state transitions over hierarchical conical microstructures",
      journal: "Advanced Materials Interfaces",
      details: "5.5, 1701039, 2018",
      link: "https://doi.org/10.1002/admi.201701039",
      special: "Cover Article"
    },
    {
      number: 7,
      authors: "Il Woong Park, Jeongrim Ryu, Maria Fernandino, Carlos Alberto Dorao",
      title: "Can flow oscillations during flow boiling deteriorate the heat transfer coefficient?",
      journal: "Applied Physics Letters",
      details: "113.15, 154102, 2018",
      link: "https://doi.org/10.1063/1.5046429"
    },
    {
      number: 6,
      authors: "Il Woong Park, Maria Fernandino, Carlos Alberto Dorao",
      title: "On the occurrence of superimposed density wave oscillations on pressure drop oscillations and the influence of a compressible volume",
      journal: "AIP Advances",
      details: "8.7, 075022, 2018",
      link: "https://doi.org/10.1063/1.5040113"
    },
    {
      number: 5,
      authors: "Il Woong Park, Maria Fernandino, Carlos Alberto Dorao",
      title: "Experimental study on the characteristics of pressure drop oscillations and their interaction with short-period oscillation in a horizontal tube",
      journal: "International Journal of Refrigeration",
      details: "91, 246, 2018",
      link: "https://doi.org/10.1016/j.ijrefrig.2018.05.008"
    },
    {
      number: 4,
      authors: "Yeon-GunLee, Il Woong Park, Dong-Won Lee, Goon-Cherl Park, Eung-Soo Kim",
      title: "Reduction of circulation power for helium-cooled fusion reactor blanket using additive CO2 gas",
      journal: "Fusion Engineering and Design",
      details: "100, 436, 2015",
      link: "https://doi.org/10.1016/j.fusengdes.2015.07.010"
    },
    {
      number: 3,
      authors: "Jeong-Hun Lee, Il Woong Park, Geon-Woo Kim, Goon-Cherl Park, Hyoung-Kyu Cho, Ki hak Im",
      title: "Thermal-hydraulic analysis of water cooled breeding blanket of K-DEMO using MARS-KS code",
      journal: "Fusion Engineering and Design",
      details: "98, 1741, 2015",
      link: "https://doi.org/10.1016/j.fusengdes.2015.05.029"
    },
    {
      number: 2,
      authors: "Su-Jong Yoon, Min-Seop Song, Il Woong Park, Dong-Won Lee, Goon-Cherl Park, Eung-Soo Kim",
      title: "Assessment of COMSOL capability to analyze thermal-hydraulic characteristics of Korean helium cooled test blanket",
      journal: "Fusion Engineering and Design",
      details: "88, 9, 2013",
      link: "https://doi.org/10.1016/j.fusengdes.2013.02.016"
    },
    {
      number: 1,
      authors: "Yeon-Gun Lee, Il Woong Park, Goon-Cherl Park",
      title: "SBLOCA and LOFW experiments in a scaled-down IET facility of rex-10 reactor",
      journal: "Nuclear Engineering and Technology",
      details: "45, 347, 2013",
      link: "https://doi.org/10.5516/NET.02.2013.024"
    }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Publications</h1>
          <p className="text-gray-600 mt-2">Total: {publications.length} Publications</p>
        </div>

        <div className="space-y-6">
          {publications.map((pub) => (
            <div key={pub.number} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                  {pub.number}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-2">
                    {pub.authors}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pub.title}
                  </h3>
                  <p className="text-blue-900 font-medium mb-1">
                    <em>{pub.journal}</em>
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    {pub.details}
                  </p>
                  {pub.special && (
                    <p className="text-red-600 text-sm font-medium mb-2">
                      {pub.special}
                    </p>
                  )}
                  <a
                    href={pub.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                  >
                    View Publication →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

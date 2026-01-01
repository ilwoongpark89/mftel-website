import Image from 'next/image';

export default function Professor() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Professor</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Profile Image */}
            <div className="md:flex-shrink-0 md:w-1/3 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
              <div className="relative w-64 h-64 rounded-full overflow-hidden shadow-xl">
                <Image
                  src="/images/Professor_Il Woong Park.png"
                  alt="Prof. Il Woong Park"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Profile Information */}
            <div className="p-8 md:w-2/3">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">Prof. Il Woong Park</h2>

              <div className="space-y-6">
                {/* Education & Career */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-900 pb-2">
                    Education & Career
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Assistant professor, Inha University (2022-)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Research Assistant Professor, Seoul National University (2022)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Research Professor, Jeju National University (2018-2021)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Ph. D. Norwegian University of Science and Technology (2014-2018)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>M. S. Seoul National University (2011-2013)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>B. S. Seoul National University (2008-2011)</span>
                    </li>
                  </ul>
                </div>

                {/* Professional Activities */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-900 pb-2">
                    Professional Activities
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Editor, The Korean Hydrogen and New Energy Society (2024-)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Editor, The Korean Society for New and Renewable Energy (2025-)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">•</span>
                      <span>Chief Technology Officer, PIOST (2025-)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

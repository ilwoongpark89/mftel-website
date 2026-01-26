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
                  <table className="w-full text-gray-700 text-sm sm:text-base">
                    <tbody>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2022 -</td>
                        <td className="align-top py-1">Assistant Professor, Inha University</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2022</td>
                        <td className="align-top py-1">Research Assistant Professor, Seoul National University</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2018 ~ 2021</td>
                        <td className="align-top py-1">Research Professor, Jeju National University</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2014 ~ 2018</td>
                        <td className="align-top py-1">Ph.D., Norwegian University of Science and Technology</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2011 ~ 2013</td>
                        <td className="align-top py-1">M.S., Seoul National University</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2008 ~ 2011</td>
                        <td className="align-top py-1">B.S., Seoul National University</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Professional Activities */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-blue-900 pb-2">
                    Professional Activities
                  </h3>
                  <table className="w-full text-gray-700 text-sm sm:text-base">
                    <tbody>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2024 -</td>
                        <td className="align-top py-1">Editor, The Korean Hydrogen and New Energy Society</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2025 -</td>
                        <td className="align-top py-1">Editor, The Korean Society for New and Renewable Energy</td>
                      </tr>
                      <tr>
                        <td className="text-blue-900 font-medium align-top py-1 pr-3 whitespace-nowrap">2025 -</td>
                        <td className="align-top py-1">Chief Technology Officer, PIOST</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

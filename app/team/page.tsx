import Image from 'next/image';

export default function Team() {
  const teamMembers = [
    { name: "Hyeon Geun Shin", photo: "Hyeon Geun Shin.jpg" },
    { name: "Hyun Jin Yong", photo: "Hyun Jin Yong.jpg" },
    { name: "Jun Beom Song", photo: "Jun Beom Song.jpg" },
    { name: "Kyeong Ju Ko", photo: "Kyeong Ju Ko.jpg" },
    { name: "Chaeyeon Kim", photo: "Chaeyeon Kim.jpg" },
    { name: "Eunbin Park", photo: "Eunbin Park.jpg" },
    { name: "Jae Hyeok Yang", photo: "Jae Hyeok Yang.jpg" },
    { name: "Manho Kim", photo: "Manho Kim.jpg" },
    { name: "Sang Min Song", photo: "Sang Min Song.jpg" },
    { name: "Sung Jin Kim", photo: "Sung Jin Kim.jpg" },
    { name: "Joonhwan Hyun", photo: "Joonhwan Hyun.jpg" },
    { name: "Yeongjun Jung", photo: "Yeongjun Jung.jpg" }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Our Team</h1>
          <p className="text-gray-600 mt-2">Meet the members of MFTEL</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-64 bg-gradient-to-br from-blue-50 to-blue-100">
                <Image
                  src={`/images/${member.photo}`}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

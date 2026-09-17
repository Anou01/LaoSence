import { useState } from "react";

import MapComponent from "@/components/MapComponent";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

// Province and district data structure
const locationData = [
  {
    province: "vientiane",
    name: "Vientiane",
    districts: [
      { value: "chanthabuly", name: "Chanthabuly" },
      { value: "sikhottabong", name: "Sikhottabong" },
      { value: "xaysetha", name: "Xaysetha" },
      { value: "sisattanak", name: "Sisattanak" },
    ],
  },
  {
    province: "luangprabang",
    name: "Luang Prabang",
    districts: [
      { value: "luangprabang-city", name: "Luang Prabang City" },
      { value: "xieng-ngeun", name: "Xieng Ngeun" },
      { value: "nan", name: "Nan" },
      { value: "pak-ou", name: "Pak Ou" },
    ],
  },
  {
    province: "savannakhet",
    name: "Savannakhet",
    districts: [
      { value: "kaysone-phomvihane", name: "Kaysone Phomvihane" },
      { value: "outhoumphone", name: "Outhoumphone" },
      { value: "atsaphone", name: "Atsaphone" },
      { value: "phin", name: "Phin" },
    ],
  },
  {
    province: "champasak",
    name: "Champasak",
    districts: [
      { value: "pakse", name: "Pakse" },
      { value: "champasak-district", name: "Champasak" },
      { value: "bachiangchaleunsouk", name: "Bachiangchaleunsouk" },
      { value: "khong", name: "Khong" },
    ],
  },
  {
    province: "attapeu",
    name: "Attapeu",
    districts: [
      { value: "samakkhixay", name: "Samakkhixay" },
      { value: "sanamxay", name: "Sanamxay" },
      { value: "phouvong", name: "Phouvong" },
      { value: "xaysetha-attapeu", name: "Xaysetha" },
    ],
  },
];

export default function AdminUploadPage() {
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Get available districts based on selected province
  const getAvailableDistricts = () => {
    const provinceData = locationData.find(
      (item) => item.province === selectedProvince
    );
    return provinceData ? provinceData.districts : [];
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    setSelectedDistrict(""); // Reset district when province changes
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
  };

  return (
    <div>
      <div className="w-full p-4">
        <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 flex flex-col items-center justify-center text-center h-100">
          <input
            type="file"
            accept=".csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <p className="text-gray-500">Drag & drop or click to upload file</p>
        </div>

        <div className="pt-4">
          <div className="flex gap-4">
            <div>
              <Select
                value={selectedProvince}
                onValueChange={handleProvinceChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Provinces</SelectLabel>
                    {locationData.map((item) => (
                      <SelectItem key={item.province} value={item.province}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={selectedDistrict}
                onValueChange={handleDistrictChange}
                disabled={!selectedProvince}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Districts</SelectLabel>
                    {getAvailableDistricts().map((district) => (
                      <SelectItem key={district.value} value={district.value}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button>Upload</Button>
          </div>
        </div>

        {/* Display selected values for testing */}
        {selectedProvince && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p>
              <strong>Selected Province:</strong>{" "}
              {locationData.find((p) => p.province === selectedProvince)?.name}
            </p>
            {selectedDistrict && (
              <p>
                <strong>Selected District:</strong>{" "}
                {
                  getAvailableDistricts().find(
                    (d) => d.value === selectedDistrict
                  )?.name
                }
              </p>
            )}
          </div>
        )}
      </div>
      {/** Map Component */}
      <div className="h-screen w-full mt-4">
        <MapComponent
          userLocation={null}
          onLocationUpdate={(location) =>
            console.log("Upload page location updated:", location)
          }
          center={[17.9757, 102.6369]}
          zoom={7}
          minZoom={5}
          maxZoom={18}
          className="h-full w-full"
          showLocationButton={true}
          locationButtonPosition="bottomleft"
          zoomControlPosition="bottomleft"
        />
      </div>
    </div>
  );
}

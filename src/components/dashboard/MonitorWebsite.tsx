import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Websites() {
  const [data, setData] = useState<any[]>([]);

useEffect(() => {
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('website_status')
      .select('*');

      if (data) {
  setData(data);
}

    console.log("🔍 Raw Data:", data);
  };


  fetchData();
}, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Website Status</h2>
      <div className="space-y-4">
        {data.map((site) => (
          <div key={site.id} className="border p-4 rounded-lg shadow-sm">
            <h3 className="text-xl">{site.name}</h3>
            <p>
              Status:{" "}
              <span
                className={
                  site.status === "up" ? "text-green-600" : "text-red-600"
                }
              >
                {site.status}
              </span>
            </p>
            <p>Response Time: {site.response_time} ms</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import axios from "axios";
import Toast from "../components/toast";

const sampleFetch = async () => {
  const response = await axios.get("/");

  const validatedResponse = "schema".safeParse(response.data);

  if (!validatedResponse.success) {
    setToast("Validated Response Invalid", validatedResponse.error.message);
    return {
      data: [],
      message: "Parse Error, Invalid response format",
      success: false,
    };
  }
  return validatedResponse.data;
};

export const useSampleFetchQuery = () => {
  return useQuery({
    queryFn: sampleFetch,
    queryKey: ["sampleKey"],
  });
};

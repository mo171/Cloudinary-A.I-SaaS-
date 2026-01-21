"use client";
/*
 * Social Share Page Component
 * This page allows users to customize and share their uploaded videos to social media.
 *
 * @returns {JSX.Element} - The rendered Social Share page UI.
 * @used_in: Automatically rendered by Next.js at the '/social-share' route.
 */
import React, {useState, useEffect, useRef} from "react";
import { CldImage } from "next-cloudinary";
import axios from "axios";


// configuration and objects
const socialFormats = {
   // go ahead ask gpt for this
    "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
    "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
    "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
    "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
    "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
  };

type SocialFormat = keyof typeof socialFormats;


function SocialShare() {

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>("Instagram Square (1:1)");
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // listening upload image
  useEffect(() => {
    if(uploadedImage){
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

/**
 * Handles file upload event, sends file to server for upload and 
 * updates the state with the public id of the uploaded image.
 * If the upload fails, it shows an alert to the user.
 * Finally, it sets the 'isUploading' state to false.
 * @param {React.ChangeEvent<HTMLInputElement>} event - The file upload event.
 */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];   
    if(!file){
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response  = await axios.post("/api/image-upload", formData);
      
      const data = response.data;
      // console.log(data);
      
      setUploadedImage(data.publicId);

    } catch (error) {
       console.log(error);
       alert("Error Uploading Image");       
    }finally{
      setIsUploading(false);
    }
  
  }

/**
 * Downloads the image from the given src link.
 * If the imageRef is null, it simply returns without doing anything.
 * It fetches the image from the src link, creates a blob from the response, and
 * creates a new link element with the blob as its href. It then appends the link to the
 * document body, clicks the link to trigger the download, removes the link from the
 * document body, and finally revokes the object URL to free up memory.
 */   

  const handleDownload = () => {
    if(!imageRef.current){
      return;
    }
    // takes the link and downloads the file (same done for webscrapping)
    fetch(imageRef.current.src)
    .then((response) =>response.blob())
    .then((blob) => {
      window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const url =  link.href
      link.download = `${selectedFormat.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click()
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link)
    })
  }


  

  return (
    <div className="container mx-auto p-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Social Media Image Creator
          </h1>

          <div className="card">
            <div className="card-body">
              <h2 className="card-title mb-4">Upload an Image</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Choose an image file</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="file-input file-input-bordered file-input-primary w-full"
                />
              </div>

              {isUploading && (
                <div className="mt-4">
                  <progress className="progress progress-primary w-full"></progress>
                </div>
              )}

              {uploadedImage && (
                <div className="mt-6">
                  <h2 className="card-title mb-4">Select Social Media Format</h2>
                  <div className="form-control">
                    <select
                      className="select select-bordered w-full"
                      value={selectedFormat}
                      onChange={(e) =>
                        setSelectedFormat(e.target.value as SocialFormat)
                      }
                    >
                      {Object.keys(socialFormats).map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6 relative">
                    <h3 className="text-lg font-semibold mb-2">Preview:</h3>
                    <div className="flex justify-center">
                      {isTransforming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-50 z-10">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      )}
                      <CldImage
                        width={socialFormats[selectedFormat].width}
                        height={socialFormats[selectedFormat].height}
                        src={uploadedImage}
                        sizes="100vw"
                        alt="transformed image"
                        crop="fill"
                        aspectRatio={socialFormats[selectedFormat].aspectRatio}
                        gravity='auto'
                        ref={imageRef}
                        onLoad={() => setIsTransforming(false)}
                        />
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button className="btn btn-primary" onClick={handleDownload}>
                      Download for {selectedFormat}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

  )
}

export default SocialShare;

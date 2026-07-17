const DRIVE_API_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_API_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

export async function findOrCreateFolder(
  token: string,
  folderName: string
): Promise<string> {
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`
  );
  const searchRes = await fetch(
    `${DRIVE_API_URL}/files?q=${query}&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    const errBody = await searchRes.text();
    throw new Error(
      `Failed to search Drive folder: ${searchRes.status} ${searchRes.statusText} - ${errBody}`
    );
  }

  const data = await searchRes.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    body: JSON.stringify({
      mimeType: "application/vnd.google-apps.folder",
      name: folderName,
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!createRes.ok) {
    throw new Error("Failed to create Drive folder");
  }

  const createData = await createRes.json();
  return createData.id;
}

export async function uploadImage(
  token: string,
  folderId: string,
  fileBlob: Blob
): Promise<void> {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

  const metadata = {
    name: `${dateStr}.jpg`,
    parents: [folderId],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", fileBlob);

  const res = await fetch(UPLOAD_API_URL, {
    body: form,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to upload image");
  }
}

export async function getUserEmail(token: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user info");
  }

  const data = await res.json();
  return data.email;
}

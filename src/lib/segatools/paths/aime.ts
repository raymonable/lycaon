import { type SegatoolsPathProblem, type SegatoolsResponse } from "../../segatools";
import { accessRelativePath } from "../fs";

export default {
    async match(entries: Record<string, Record<string, string | number | boolean>>, binPath: FileSystemDirectoryEntry, scope: FileSystemDirectoryEntry): Promise<undefined | SegatoolsResponse> {
        if (!entries["aime"]) return;
        let enable = entries["aime"]["enable"];
        if (typeof (enable) == "boolean" && enable && entries["aime"]["aimePath"]) {
            
            let path = entries["aime"]["aimePath"] as string;
            let file = await accessRelativePath(binPath, path, scope);

            if (file) {
                let data = await new Promise(r => (file as FileSystemFileEntry).file(f => r(f))) as File;
                let aime = await data.text();
                
                if (aime.length != 20)
                    return {
                        type: "warning",
                        description: `Your Aime access code is only ${aime.length} digits long (out of 20).`
                    }
                if (aime.at(0) == "3")
                    return {
                        type: "warning",
                        description: "Your Aime access code begins with 3. This will not work."
                    }
            }
        }
        return;
    }
} as SegatoolsPathProblem;
import { supabase } from "@/lib/supabase";

export async function verificarAuth(
    router: any
) {

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {

        router.push("/login");
    }
}
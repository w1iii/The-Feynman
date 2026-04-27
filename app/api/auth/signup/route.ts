import { createClient } from '@/lib/supabase/server'
import {NextRequest, NextResponse} from "next/server";

const supabase = createClient()

export async function POST(req: NextRequest){
    const {data: users} = await supabase
        .from()
        .select()
        .eq()


}

import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import z, { success } from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
    conversationId: z.string(),
    message: z.string(),
})

export async function POST(request: Request) {
    const {userId} = await auth()
    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }
    const internalKey = process.env.POINTER_CONVEX_INTERNAL_KEY
    if(!internalKey){
        return NextResponse.json({error: "Internal key not configured"}, {status: 500})
    }
    const body = await request.json()
    const {conversationId, message} = requestSchema.parse(body)

    const conversation = await convex.query(api.system.getConversationById,{
        conversationId: conversationId as Id<"conversations">,
        internalKey
    })

    if(!conversation){
        return  NextResponse.json({error: "Conversation not found"}, {status: 404})
    }

    const projectId = conversation.projectId

     await convex.mutation(api.system.createMessage,{
        internalKey,
        conversationId: conversationId as Id<"conversations">,
        content: message,
        projectId,
        role: "user",
    })

    const assistantMessageId = await convex.mutation(api.system.createMessage,{
        internalKey,
        conversationId: conversationId as Id<"conversations">,
        content: "",
        projectId,
        role: "assistant",
        status:"processing"
    })

    const event =await inngest.send({
        name : "message/sent",
        data:{
            messageId:assistantMessageId
        }
    })


    return NextResponse.json({
       success: true,
       eventId:event.ids[0],
       messageId:assistantMessageId
    })


}
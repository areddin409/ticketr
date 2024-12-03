"use client";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { WAITING_LIST_STATUS } from "@/convex/constants";
import Spinner from "./Spinner";
import { Clock, OctagonXIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConvexError } from "convex/values";

type JoinQueueProps = {
  eventId: Id<"events">;
  userId: string;
};

export default function JoinQueue({ eventId, userId }: JoinQueueProps) {
  const { toast } = useToast();
  const joinWaitingList = useMutation(api.events.joinWaitingList);
  const queuePosition = useQuery(api.waitingList.getQueuePosition, {
    eventId,
    userId,
  });
  const userTicket = useQuery(api.tickets.getUserTicketForEvent, {
    eventId,
    userId,
  });
  const availability = useQuery(api.events.getEventAvailability, { eventId });
  const event = useQuery(api.events.getById, { eventId });

  const isEventOwner = userId === event?.userId;
  const isPastEvent = event?.eventDate ? event.eventDate < Date.now() : false;

  const isSoldOut =
    availability?.purchasedCount != null &&
    availability?.totalTickets != null &&
    availability.purchasedCount >= availability.totalTickets;

  const isLoading =
    queuePosition === undefined || availability === undefined || !event;

  const isQueueActive =
    queuePosition &&
    queuePosition.status !== WAITING_LIST_STATUS.EXPIRED &&
    !(
      queuePosition.status === WAITING_LIST_STATUS.OFFERED &&
      queuePosition.offerExpiresAt &&
      queuePosition.offerExpiresAt <= Date.now()
    );

  const handleJoinQueue = async () => {
    try {
      const result = await joinWaitingList({ eventId, userId });
      if (result.success) {
        console.log("Successfully joined waiting list");
      }
    } catch (error) {
      if (
        error instanceof ConvexError &&
        error.message.includes("joined the waiting list too many times")
      ) {
        toast({
          variant: "destructive",
          title: "Slow down there!",
          description: error.data,
          duration: 5000,
        });
      } else {
        console.error("Error joining waiting list:", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Failed to join queue. Please try again later.",
        });
      }
    }
  };

  if (isLoading) return <Spinner />;
  if (userTicket) return null;
  if (isQueueActive) return null;

  return (
    <div>
      {isEventOwner ? (
        <OwnerMessage />
      ) : isPastEvent ? (
        <PastEventMessage />
      ) : isSoldOut ? (
        <SoldOutMessage />
      ) : (
        <BuyTicketButton
          onClick={handleJoinQueue}
          disabled={isPastEvent || isEventOwner}
        />
      )}
    </div>
  );
}

function OwnerMessage() {
  return (
    <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg">
      <OctagonXIcon className="w-5 h-5" />
      <span>You cannot buy a ticket for your own event</span>
    </div>
  );
}

function PastEventMessage() {
  return (
    <div className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
      <Clock className="w-5 h-5" />
      <span>Event has ended</span>
    </div>
  );
}

function SoldOutMessage() {
  return (
    <div className="text-center p-4">
      <p className="text-lg font-semibold text-red-600">
        Sorry, this event is sold out
      </p>
    </div>
  );
}

type BuyTicketButtonProps = {
  onClick: () => void;
  disabled: boolean;
};

function BuyTicketButton({ onClick, disabled }: BuyTicketButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      Buy Ticket
    </button>
  );
}

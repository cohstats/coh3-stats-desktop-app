import { Badge, Group, Tooltip } from "@mantine/core";
import { SteamIcon } from "./other/Steam-icon";
import { useOnlinePlayersData } from "../hooks/useOnlinePlayersData";

interface OnlinePlayersProps {
  compact?: boolean;
}

export const OnlinePlayers: React.FC<OnlinePlayersProps> = ({ compact = false }) => {
  const { onlinePlayersData, isLoading, error } = useOnlinePlayersData();

  return (
    <Tooltip
      label={`Amount of online Steam players in Company of Heroes 3 as of ${new Date(
        onlinePlayersData?.timeStampMs || "",
      ).toLocaleString()}`}
      multiline
      w={300}
      withArrow
    >
      <div>
        <Group gap={6}>
          <SteamIcon size={compact ? 18 : 20} />
          {!compact && "Players in game"}
          <Badge
            color="green"
            variant="filled"
            size={"md"}
            style={{
              minWidth: 60,
              marginBottom: compact ? 0 : -1,
            }}
            data-testid={compact ? "online-players-badge-compact" : "online-players-badge"}
          >
            {isLoading ? "..." : onlinePlayersData?.playerCount || "N/A"}
          </Badge>
        </Group>
      </div>
    </Tooltip>
  );
};

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

interface LogoutButtonProps {
  variant?: "text" | "outlined" | "contained" | "icon";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

export default function LogoutButton({ variant = "contained", size = "medium", fullWidth = false }: LogoutButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      setLoading(false);
      setOpen(false);
    }
  };

  if (variant === "icon") {
    return (
      <>
        <Tooltip title="로그아웃">
          <IconButton
            onClick={handleClickOpen}
            size={size}
            sx={{
              color: "text.secondary",
              "&:hover": {
                color: "error.main",
                backgroundColor: "error.light",
                transform: "scale(1.1)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <PowerSettingsNewIcon />
          </IconButton>
        </Tooltip>

        <Dialog
          open={open}
          onClose={handleClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 320,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            로그아웃 확인
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              정말 로그아웃 하시겠습니까?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} color="inherit" disabled={loading}>
              취소
            </Button>
            <Button
              onClick={handleLogout}
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              disabled={loading}
              sx={{
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 3,
                },
                transition: "all 0.3s ease",
              }}
            >
              {loading ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleClickOpen}
        startIcon={<LogoutIcon />}
        color="error"
        sx={{
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: variant === "contained" ? 4 : 2,
          },
          transition: "all 0.3s ease",
        }}
      >
        로그아웃
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          로그아웃 확인
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            정말 로그아웃 하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            disabled={loading}
            sx={{
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 3,
              },
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

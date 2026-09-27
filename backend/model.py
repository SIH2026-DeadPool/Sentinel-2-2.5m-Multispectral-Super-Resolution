
import torch
import torch.nn as nn
import torch.nn.functional as F


def window_partition(x, window_size):

    B, H, W, C = x.shape

    x = x.view(
        B,
        H // window_size,
        window_size,
        W // window_size,
        window_size,
        C
    )

    windows = x.permute(
        0,
        1,
        3,
        2,
        4,
        5
    ).contiguous()

    return windows.view(
        -1,
        window_size * window_size,
        C
    )


def window_reverse(
    windows,
    window_size,
    H,
    W,
    C
):

    B = windows.shape[0] // (
        H // window_size
    ) // (
        W // window_size
    )

    x = windows.view(
        B,
        H // window_size,
        W // window_size,
        window_size,
        window_size,
        C
    )

    x = x.permute(
        0,
        1,
        3,
        2,
        4,
        5
    ).contiguous()

    return x.view(
        B,
        H,
        W,
        C
    )


class SwinBlock(nn.Module):

    def __init__(
        self,
        dim=32,
        heads=4,
        window_size=8,
        shift=0
    ):

        super().__init__()

        self.window_size = window_size
        self.shift = shift

        self.norm1 = nn.LayerNorm(dim)

        self.attn = nn.MultiheadAttention(
            embed_dim=dim,
            num_heads=heads,
            batch_first=True
        )

        self.norm2 = nn.LayerNorm(dim)

        self.mlp = nn.Sequential(
            nn.Linear(
                dim,
                dim * 2
            ),
            nn.GELU(),
            nn.Linear(
                dim * 2,
                dim
            )
        )

    def forward(self, x):

        B, C, H, W = x.shape

        shortcut = x

        x = x.permute(
            0,
            2,
            3,
            1
        )

        if self.shift:

            x = torch.roll(
                x,
                shifts=(
                    -self.shift,
                    -self.shift
                ),
                dims=(1, 2)
            )

        windows = window_partition(
            x,
            self.window_size
        )

        residual = windows

        windows = self.norm1(
            windows
        )

        attn, _ = self.attn(
            windows,
            windows,
            windows,
            need_weights=False
        )

        windows = (
            residual + attn
        )

        windows = (
            windows
            + self.mlp(
                self.norm2(windows)
            )
        )

        x = window_reverse(
            windows,
            self.window_size,
            H,
            W,
            C
        )

        if self.shift:

            x = torch.roll(
                x,
                shifts=(
                    self.shift,
                    self.shift
                ),
                dims=(1, 2)
            )

        x = x.permute(
            0,
            3,
            1,
            2
        )

        return shortcut + x


class ResidualGroup(nn.Module):

    def __init__(
        self,
        dim=32
    ):

        super().__init__()

        self.blocks = nn.Sequential(

            SwinBlock(
                dim=dim,
                heads=4,
                window_size=8,
                shift=0
            ),

            SwinBlock(
                dim=dim,
                heads=4,
                window_size=8,
                shift=4
            )
        )

        self.conv = nn.Conv2d(
            dim,
            dim,
            3,
            padding=1
        )

    def forward(self, x):

        residual = x

        x = self.blocks(x)

        x = self.conv(x)

        return residual + x


class FastSEN2SR(nn.Module):

    def __init__(
        self,
        in_channels=4,
        out_channels=4,
        dim=32
    ):

        super().__init__()

        self.head = nn.Conv2d(
            in_channels,
            dim,
            3,
            padding=1
        )

        self.group1 = ResidualGroup(
            dim
        )

        self.group2 = ResidualGroup(
            dim
        )

        self.body = nn.Conv2d(
            dim,
            dim,
            3,
            padding=1
        )

        self.up1 = nn.Sequential(
            nn.Conv2d(
                dim,
                dim * 4,
                3,
                padding=1
            ),
            nn.PixelShuffle(2),
            nn.GELU()
        )

        self.up2 = nn.Sequential(
            nn.Conv2d(
                dim,
                dim * 4,
                3,
                padding=1
            ),
            nn.PixelShuffle(2),
            nn.GELU()
        )

        self.tail = nn.Conv2d(
            dim,
            out_channels,
            3,
            padding=1
        )

    def forward(self, lr):

        bicubic = F.interpolate(
            lr,
            scale_factor=4,
            mode="bicubic",
            align_corners=False
        )

        x = self.head(lr)

        residual = x

        x = self.group1(x)

        x = self.group2(x)

        x = self.body(x)

        x = x + residual

        x = self.up1(x)

        x = self.up2(x)

        residual_hr = self.tail(x)

        sr = bicubic + residual_hr

        return torch.clamp(
            sr,
            0,
            1
        )

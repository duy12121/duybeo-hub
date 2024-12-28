-- 
local player = game.Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- 
local screenGui = Instance.new("ScreenGui")
screenGui.Parent = playerGui

-- 
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0.4, 0, 0.3, 0) -- Chiều rộng 40%, chiều cao 30% màn hình
frame.Position = UDim2.new(0.3, 0, 0.35, 0) -- Căn giữa màn hình
frame.BackgroundColor3 = Color3.fromRGB(30, 30, 30) -- Màu nền
frame.Parent = screenGui

-- 
local textLabel = Instance.new("TextLabel")
textLabel.Size = UDim2.new(1, 0, 0.8, 0) -- Chiếm 80% chiều cao của Frame
textLabel.Position = UDim2.new(0, 0, 0, 0)
textLabel.Text = "Bạn bị văng ra khỏi trải nghiệm này:\nCó Cái Lồn Địt Mẹ Mày Tham Lam Vừa Thằng Đầu Cặc\n(Mã Lỗi: 267)"
textLabel.TextColor3 = Color3.fromRGB(255, 255, 255) -- Màu chữ trắng
textLabel.TextScaled = true -- Tự động thu phóng chữ
textLabel.BackgroundTransparency = 1 -- Trong suốt
textLabel.Font = Enum.Font.SourceSansBold -- Font chữ
textLabel.Parent = frame

-- 
local leaveButton = Instance.new("TextButton")
leaveButton.Size = UDim2.new(0.4, 0, 0.2, 0) -- Chiếm 40% chiều rộng, 20% chiều cao
leaveButton.Position = UDim2.new(0.3, 0, 0.8, 0) -- Đặt dưới TextLabel
leaveButton.Text = "Rời Khỏi"
leaveButton.TextColor3 = Color3.fromRGB(255, 255, 255)
leaveButton.BackgroundColor3 = Color3.fromRGB(200, 50, 50) -- Màu đỏ
leaveButton.Font = Enum.Font.SourceSansBold
leaveButton.TextScaled = true
leaveButton.Parent = frame

-- 
leaveButton.MouseButton1Click:Connect(function()
    player:Kick("Bạn đã rời khỏi trò chơi.") -- Đẩy người chơi ra khỏi game
end)

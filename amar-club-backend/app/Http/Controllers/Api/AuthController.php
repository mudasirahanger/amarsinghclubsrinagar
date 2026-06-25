<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validate the incoming request
        $request->validate([
            'member_id' => 'required|string',
            'password' => 'required|string',
        ]);

        // 2. Find the Member
        $user = User::where('member_id', $request->member_id)->first();

        // 3. Verify Member & Password
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid Member ID or Secret Code.'
            ], 401);
        }

        // 4. Ensure account is active
        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'This membership is currently suspended.'
            ], 403);
        }

        // 5. Generate Sanctum Token
        $token = $user->createToken('mobile-app-token')->plainTextToken;

        // Log the activity
        activity()
            ->causedBy($user)
            ->event('login')
            ->log('Member logged in');

        // 6. Return the Token & User Profile Data
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'member_id' => $user->member_id,
                'member_tier' => $user->member_tier,
                'wallet_balance' => $user->wallet_balance,
            ]
        ], 200);
    }

    public function updateSecretCode(Request $request)
    {
        // 1. Validate the input (enforce 4 digits)
        $request->validate([
            'current_code' => 'required|string',
            'new_code' => 'required|digits:4', 
        ]);

        $user = $request->user();

        // 2. Check if the current code matches what's in the database
        if (!Hash::check($request->current_code, $user->password)) {
            return response()->json([
                'message' => 'Your current Secret Code is incorrect.'
            ], 400); // 400 Bad Request
        }

        // 3. Update to the new code
        $user->password = Hash::make($request->new_code);
        $user->save();

        return response()->json([
            'message' => 'Secret Code updated successfully.'
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:15',
        ]);

        $user = $request->user();
        $user->update([
            'email' => $request->email,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user
        ], 200);
    }

    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ], 200);
    }
}

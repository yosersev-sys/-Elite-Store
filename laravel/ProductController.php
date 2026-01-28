
<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return Product::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'categoryId' => 'required|string',
            'stockQuantity' => 'required|integer|min:0', // إضافة التحقق
            'images' => 'required|array',
            'sizes' => 'nullable|array',
            'colors' => 'nullable|array',
            'seoSettings' => 'nullable|array'
        ]);

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'categoryId' => 'required|string',
            'stockQuantity' => 'required|integer|min:0', // إضافة التحقق
            'images' => 'required|array',
            'sizes' => 'nullable|array',
            'colors' => 'nullable|array',
            'seoSettings' => 'nullable|array'
        ]);

        $product->update($validated);
        return response()->json($product);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'تم الحذف بنجاح']);
    }
}
